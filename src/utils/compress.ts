import type { CompressOptions, ImageInfo } from '@/types'

export function getImageExtension(file: ImageInfo) {
  let ext = file.fileExtension.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') {
    ext = 'jpg'
  }
  return ext
}

export function mergeCompressOptions(
  file: ImageInfo,
  defaultQuality: number | undefined,
  options: CompressOptions | undefined
) {
  const ext = getImageExtension(file)
  const defaultOptions = {
    formats: [ext],
    quality: defaultQuality || 80,
    overwrite: true,
    width: undefined,
    height: undefined
  }
  if (options) {
    return {
      ...defaultOptions,
      ...options
    }
  }
  return defaultOptions
}
