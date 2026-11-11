/** Downscale an image (honouring EXIF rotation) to a JPEG no larger than maxDim on its long side. */
export async function resizeImage(src: Blob, maxDim: number, quality = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(src, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', quality),
  )
}
