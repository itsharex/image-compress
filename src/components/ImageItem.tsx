import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { Select, InputNumber, Checkbox, Spin, ConfigProvider } from 'antd';
import type { SelectProps } from 'antd';
import { CompressImage, CompressOptions } from '@/types';
import { invoke } from '@tauri-apps/api';
import { formatBytes } from '@/utils';
import { CheckCircleFilled, ClockCircleFilled, CloseCircleFilled, CloseOutlined, LoadingOutlined, LockOutlined, RightOutlined, UnlockOutlined } from '@ant-design/icons';
import { getImageExtension } from '@/utils/compress';
import useSettings from '@/hooks/useSettings';

interface ImageItemProps {
  file: CompressImage
  onOptionsChange: (options: CompressOptions) => void
}

const miniStyle: CSSProperties = { fontSize: '12px' }

const ImageItem = ({ file, onOptionsChange }: ImageItemProps) => {
  const { settings } = useSettings()
  const [expanded, setExpanded] = useState(false);

  const [originSize, setOriginSize] = useState<[number, number]>([0, 0]);

  const ext = useMemo(() => getImageExtension(file), [file]);
  // 是否显示尺寸调整
  const showSizeChange = useMemo(() => {
    return !!originSize[0] && !['svg'].includes(ext);
  }, [ext, originSize]);
  // 可输出的格式
  const formats = useMemo<SelectProps['options']>(() => {
    if (['svg'].includes(ext)) {
      return [{ value: 'svg', label: 'SVG' }];
    }
    return [
      { value: 'jpg', label: 'JPEG' },
      { value: 'png', label: 'PNG' },
      { value: 'webp', label: 'WebP' },
      // { value: 'avif', label: 'AVIF' },
    ]
  }, [ext]);

  const [compressOptions, setCompressOptions] = useState<CompressOptions>(() => {
    return {
      formats: [ext],
      quality: settings.defaultQuality || 80,
      overwrite: true,
      width: undefined,
      height: undefined,
    }
  });
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [isLoadingSize, setIsLoadingSize] = useState(false);

  const toggleExpand = () => setExpanded(!expanded);

  const changeOptions = (key: keyof CompressOptions, value: any) => {
    setCompressOptions(v => ({ ...v, [key]: value }));
  };

  const onSizeChange = (field: 'width' | 'height', value: number | null) => {
    let val = value;
    if (val === null) {
      val = field === 'width' ? originSize[0] : originSize[1];
    }
    if (keepAspectRatio) {
      setCompressOptions({ ...compressOptions, [field]: value, [field === 'width' ? 'height' : 'width']: Math.round(val * originSize[field === 'width' ? 1 : 0] / originSize[field === 'width' ? 0 : 1 ]) });
    } else {
      setCompressOptions({ ...compressOptions, [field]: value });
    }
  }

  useEffect(() => {
    onOptionsChange(compressOptions);
  }, [compressOptions])

  useEffect(() => {
    if (expanded && originSize[0] === 0 && originSize[1] === 0) {
      setIsLoadingSize(true);
      invoke('get_image_dimensions', { filePath: file.filePath })
        .then((res) => {
          const [width, height] = res as [number, number];
          setOriginSize([width, height]);
          setCompressOptions({ ...compressOptions, width, height });
          setIsLoadingSize(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoadingSize(false);
        });
    }
  }, [expanded]);

  return (
    <Spin spinning={isLoadingSize}>
      <div className="flex items-center border-b border-gray-200 border-b-solid divide-x divide-gray-200 divide-x cursor-pointer" onClick={toggleExpand}>
        <div className="cell w-5">
          {file.compressStatus === 'pending' ? <ClockCircleFilled className='text-gray-500' />
            : file.compressStatus === 'compressing' ? <LoadingOutlined className='text-blue-500' />
            : file.compressStatus === 'success' ? <CheckCircleFilled className='text-green-500' />
            : <CloseCircleFilled className='text-red-500' />
          }
        </div>
        <div className="cell flex-1 flex items-center overflow-hidden">
          <RightOutlined className={`mr-1 text-gray-300 ${expanded ? 'rotate-90' : ''}`} />
          <div className='flex-1 truncate' title={file.fileName}>{file.fileName}</div>
        </div>
        <div className="cell w-24">{formatBytes(file.fileSize)}</div>
        <div className="cell w-20">
          {file.compressStatus === 'success' ? formatBytes(file.savedSize) : '　'}
        </div>
      </div>
      {expanded && (
        <div className="flex items-center py-1 text-xs border-b border-gray-200 border-b-solid">
          {showSizeChange && <div className="flex items-center pl-2 pr-4 flex-shrink-0">
            <span className='mr-2'>调整尺寸</span>
            <InputNumber controls={false} className='w-12' size='small' value={compressOptions.width} style={miniStyle}
              onChange={e => onSizeChange('width', e)} />
            <CloseOutlined className='mx-1' />
            <InputNumber controls={false} className='w-12' size='small' value={compressOptions.height} style={miniStyle}
              onChange={e => onSizeChange('height', e)}
            />
            {keepAspectRatio ? <LockOutlined title="保持宽高比" className='ml-2 cursor-pointer' onClick={() => setKeepAspectRatio(false)} /> : <UnlockOutlined title="取消保持宽高比" className='ml-2 cursor-pointer' onClick={() => setKeepAspectRatio(true)}   />}
          </div>}
          <div className="flex items-center px-4">
            <span className='mr-2 flex-shrink-0'>输出格式</span>
            <Select
              size='small'
              mode='multiple'
              className='![&_.ant-select-selection-item]:pl-1 ![&_.ant-select-selection-item]:text-11px'
              value={compressOptions.formats}
              options={formats}
              onChange={v => changeOptions('formats', v)}
              style={miniStyle}
            />
          </div>
          <div className="flex items-center px-4 flex-shrink-0">
            <span className='mr-2'>压缩比</span>
            <InputNumber className='w-13 [&_.ant-input-number]:text-xs [&_.ant-input-number-suffix]:mr-1' size='small' controls={false} value={compressOptions.quality} suffix='%' style={miniStyle} />
          </div>
          <div className="flex items-center ml-auto flex-shrink-0">
            <ConfigProvider theme={{ token: { colorPrimary: 'rgb(51,51,51)' } }}>
              <Checkbox
              className=''
              checked={compressOptions.overwrite}
              onChange={e => changeOptions('overwrite', e.target.checked)}
              style={miniStyle}>覆盖原文件</Checkbox>
            </ConfigProvider>
          </div>
        </div>
      )}
    </Spin>
  );
};

export default ImageItem;
