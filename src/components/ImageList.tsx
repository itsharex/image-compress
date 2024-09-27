import { useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { Dropdown } from 'antd';
import ImageItem from './ImageItem';
import { CompressImage, CompressOptions, ImageInfo } from '@/types';
import { SettingOutlined } from '@ant-design/icons';
import TaskQueue from '@/utils/queue';
import useSettings from '@/hooks/useSettings';
import { mergeCompressOptions } from '@/utils/compress';


const ImageList = ({ files }: { files: ImageInfo[] }) => {
  const { settings } = useSettings()
  // 是否正在压缩
  const [isCompressing, setIsCompressing] = useState(false);
  // 需要压缩的文件
  const [compressFiles, setCompressFiles] = useState<CompressImage[]>(files.map(file => ({ ...file, compressStatus: 'pending', savedSize: 0   })));
  // 输出目录
  const [outputDir, setOutputDir] = useState('');
  // 压缩配置map
  const compressOptionsMap = useRef<Map<string, CompressOptions>>(new Map());

  const compressImage = (file: ImageInfo) => {
    const options = mergeCompressOptions(file, settings.defaultQuality, compressOptionsMap.current.get(file.filePath))
    console.log('compressing...', file.filePath, options)
    return invoke('compress_image', { filePath: file.filePath, options })
  };

  const chooseOutputDir = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: outputDir,
    });
    if (Array.isArray(selected)) {
      setOutputDir(selected[0]);
    } else if (selected) {
      setOutputDir(selected);
    }
    setTimeout(startCompress, 300)
  };

  // 开始压缩
  const startCompress = () => {
    setIsCompressing(true);
    const taskQueue = new TaskQueue();
    for (const file of compressFiles) {
      taskQueue.addTask(async () => {
        setCompressFiles(files => files.map<CompressImage>(_file => {
          if (_file.filePath === file.filePath) {
            return { ..._file, compressStatus: 'compressing' }
          }
          return _file
        }))
        try {
          const res = await compressImage(file)
          await new Promise(resolve => setTimeout(resolve, 2000))
          setCompressFiles(files => files.map<CompressImage>(_file => {
            if (_file.filePath === file.filePath) {
              return { ..._file, compressStatus: res ? 'success' : 'error' }
            }
            return _file
          }))
        } catch (error) {
          setCompressFiles(files => files.map<CompressImage>(_file => {
            if (_file.filePath === file.filePath) {
              return { ..._file, compressStatus: 'error' }
            }
            return _file
          }))
        }

    });
    }
    taskQueue.run(() => {
      setIsCompressing(false);
    });
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className='flex items-center border-y border-gray-200 border-y-solid divide-x divide-gray-200 divide-x'>
          <div className="cell w-5"></div>
          <div className="cell flex-1">文件名</div>
          <div className="cell w-24">压缩前</div>
          <div className="cell w-20">节省</div>
        </div>
        {compressFiles.map((file) => (
          <ImageItem
            key={file.filePath}
            file={file}
            onOptionsChange={opt => compressOptionsMap.current.set(file.filePath, opt)}
          />
      ))}
      </div>
      <div className="flex items-center mt-5 p-3 text-sm">
        <div className="flex items-center cursor-pointer">
          <SettingOutlined />
          <span className='ml-2'>系统设置</span>
        </div>
        <Dropdown.Button className='ml-auto w-[min-content]' menu={{
          items: [
            { key: 'chooseOutputDir', label: '选择统一输出目录', disabled: isCompressing },
          ],
          onClick(e){
            if (e.key === 'chooseOutputDir') {
              chooseOutputDir();
            }
          }
        }} type='primary' loading={isCompressing} onClick={startCompress}>
          开始压缩
        </Dropdown.Button>
      </div>
    </div>
  );
};

export default ImageList;
