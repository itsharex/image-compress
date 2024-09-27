export type ImageInfo = {
    fileName: string;
    filePath: string;
    fileExtension: string;
    fileSize: number;
}

export type CompressStatus = 'pending' | 'compressing' | 'success' | 'error';

export type CompressImage = ImageInfo & { compressStatus: CompressStatus; savedSize: number }

export type CompressOptions = {
    width?: number;
    height?: number;
    formats: string[];
    quality?: number;
    overwrite?: boolean;
}
