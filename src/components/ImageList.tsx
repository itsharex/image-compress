import { EMPTY_VIEW_ID } from '@/constants'
import useSettings from '@/hooks/useSettings'
import type { CompressImage, CompressOptions, ImageInfo } from '@/types'
import { formatBytes } from '@/utils'
import { mergeCompressOptions } from '@/utils/compress'
import TaskQueue from '@/utils/queue'
import { Dropdown, message, Tooltip } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import ImageItem from './ImageItem'
import Settings from './Settings'
import { QuestionCircleOutlined } from '@ant-design/icons'

const ImageList = () => {
  const [msg, contextHolder] = message.useMessage()
  const { settings } = useSettings()
  // 是否正在压缩
  const [isCompressing, setIsCompressing] = useState(false)
  // 需要压缩的文件
  const [compressFiles, setCompressFiles] = useState<CompressImage[]>([])
  const [totalSavedSize, setTotalSavedSize] = useState(0)
  // 输出目录
  const outputDir = useRef('')
  // 压缩配置map
  const compressOptionsMap = useRef<Map<string, CompressOptions>>(new Map())

  const compressImage = (file: ImageInfo) => {
    const options = mergeCompressOptions(file, settings.defaultQuality, compressOptionsMap.current.get(file.filePath))
    if (options.width === file.width && options.height === file.height) {
      options.width = undefined
      options.height = undefined
    }
    console.log('compressing...', file.filePath, options)
    return window.ipcRenderer.invoke('compress_image', file.filePath, options, outputDir.current)
  }

  const chooseOutputDir = async () => {
    const selected = await window.ipcRenderer.invoke('select_output_dir', '选择输出目录')
    if (selected) {
      outputDir.current = selected
      setTimeout(startCompress, 300)
    }
  }

  // 开始压缩
  const startCompress = () => {
    setIsCompressing(true)
    const taskQueue = new TaskQueue()
    let totalSavedSize = 0
    for (const [index, file] of compressFiles.entries()) {
      taskQueue.addTask(async () => {
        setCompressFiles(files =>
          files.map<CompressImage>(_file => {
            if (_file.filePath === file.filePath) {
              return { ..._file, compressStatus: 'compressing' }
            }
            return _file
          })
        )
        try {
          // 视线滚动
          if (index > taskQueue.maxConcurrent / 2) {
            document
              .querySelector(`.image-item:nth-child(${index - Math.floor(taskQueue.maxConcurrent / 2)})`)
              ?.scrollIntoView({ behavior: 'smooth' })
          }
          const outputSize: number | null = await compressImage(file)
          console.log('res', file.filePath, file.fileSize, outputSize)
          const savedSize = outputSize ? file.fileSize - outputSize : 0
          setCompressFiles(files =>
            files.map<CompressImage>(_file => {
              if (_file.filePath === file.filePath) {
                return {
                  ..._file,
                  compressStatus: outputSize ? 'success' : 'error',
                  savedSize
                }
              }
              return _file
            })
          )
          totalSavedSize += savedSize
        } catch (error) {
          setCompressFiles(files =>
            files.map<CompressImage>(_file => {
              if (_file.filePath === file.filePath) {
                return { ..._file, compressStatus: 'error' }
              }
              return _file
            })
          )
        }
      })
    }
    taskQueue.run(() => {
      setIsCompressing(false)
      setTotalSavedSize(totalSavedSize)
    })
  }

  // 拖拽文件
  const onDropFiles = async (e: DragEvent) => {
    e.preventDefault()
    if (isCompressing) {
      msg.warning('等待前一个压缩任务完成')
      return
    }
    const files = Array.from(e.dataTransfer?.files as FileList).map(file => file.path)
    if (!files.length) {
      return
    }
    const originFiles = compressFiles.reduce<Record<string, 1>>((acc, file) => {
      acc[file.filePath] = 1
      return acc
    }, {})
    try {
      let imageFiles = (await window.ipcRenderer.invoke('read_image_files', files)) as ImageInfo[]
      imageFiles = imageFiles.filter(file => !originFiles[file.filePath])
      if (!imageFiles.length) {
        msg.warning('未读取到图片资源')
        return
      }
      msg.success(`成功读取到新的${imageFiles.length}张图片`)
      setTotalSavedSize(0)
      document.getElementById(EMPTY_VIEW_ID)?.remove()
      setCompressFiles(prevFiles => [
        ...imageFiles.map<CompressImage>(file => ({ ...file, compressStatus: 'pending', savedSize: 0 })),
        ...prevFiles.filter(file => ['pending', 'compressing'].includes(file.compressStatus))
      ])
    } catch (error) {
      msg.error('读取文件失败\n' + error)
    }
  }

  const totalOriginSize = useMemo(() => compressFiles.reduce((acc, file) => acc + file.fileSize, 0), [compressFiles])

  useEffect(() => {
    const overHandler = (e: DragEvent) => e.preventDefault()
    document.addEventListener('dragover', overHandler)
    document.addEventListener('drop', onDropFiles)
    return () => {
      document.removeEventListener('dragover', overHandler)
      document.removeEventListener('drop', onDropFiles)
    }
  }, [compressFiles])

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-dark-400">
      {contextHolder}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center border-y border-gray-200 dark:border-gray-600 dark:border-gray-200 dark:border-gray-600 border-y-solid divide-x divide-gray-200 dark:divide-gray-600 dark:divide-gray-200 dark:divide-gray-600 divide-x">
          <div className="cell w-5"></div>
          <div className="cell flex-1">文件名</div>
          <div className="cell w-24">压缩前</div>
          <div className="cell w-22">压缩后</div>
          <div className="cell w-22">节省</div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {compressFiles.map(file => (
            <ImageItem
              key={file.filePath}
              file={file}
              onOptionsChange={opt => compressOptionsMap.current.set(file.filePath, opt)}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center mt-5 p-3 text-sm">
        <Settings />
        <div className="ml-auto flex items-center">
          {totalSavedSize > 0 && <Tooltip className="mr-2" title={(
            <>
              <div className="">源文件累计：{formatBytes(totalOriginSize)}</div>
              <div className="mt-1">压缩后文件累计：{formatBytes(totalOriginSize - totalSavedSize)}</div>
              <div className="mt-1">压缩比：{Math.round((totalSavedSize / totalOriginSize) * 10000) / 100}%</div>
            </>
          )}>
            <span className='cursor-help'>
              <QuestionCircleOutlined className='mr-1' />
              本次累计节省：{formatBytes(totalSavedSize)}
            </span>
          </Tooltip>}
          <Dropdown.Button
            className="w-[min-content]"
            menu={{
              items: [
                { key: 'chooseOutputDir', label: '选择保存目录(单次生效)', disabled: isCompressing },
                { key: 'clear', label: '清空列表', disabled: isCompressing }
              ],
              onClick(e) {
                if (e.key === 'chooseOutputDir') {
                  chooseOutputDir()
                } else if (e.key === 'clear') {
                  setCompressFiles([])
                  setTotalSavedSize(0)
                }
              }
            }}
            type="primary"
            loading={isCompressing}
            onClick={startCompress}
          >
            开始压缩
          </Dropdown.Button>
        </div>
      </div>
    </div>
  )
}

export default ImageList
