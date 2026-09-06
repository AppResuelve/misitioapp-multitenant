import imageCompression from 'browser-image-compression';

interface CompressOptions {
  compressThresholdMB?: number;
  targetMaxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  savingsThreshold?: number;
}

function renameToWebP(file: File): File {
  const name = file.name.replace(/\.[^.]+$/, '.webp');
  return new File([file], name, { type: 'image/webp' });
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    compressThresholdMB = 2,
    targetMaxSizeMB = 2,
    maxWidthOrHeight = 2500,
    quality = 0.9,
    savingsThreshold = 0.2,
  } = options;

  if (file.size <= compressThresholdMB * 1024 * 1024) return file;
  if (file.type === 'image/gif') return file;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: targetMaxSizeMB,
      maxWidthOrHeight,
      initialQuality: quality,
      fileType: 'image/webp',
      useWebWorker: true,
    });

    const savedRatio = 1 - compressed.size / file.size;
    if (savedRatio < savingsThreshold) return file;

    return renameToWebP(compressed);
  } catch {
    return file;
  }
}

export async function compressImages(
  files: File[],
  options?: CompressOptions
): Promise<File[]> {
  return Promise.all(files.map(f => compressImage(f, options)));
}
