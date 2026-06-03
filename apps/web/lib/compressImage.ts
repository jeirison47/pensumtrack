// Comprime y redimensiona una imagen en el navegador antes de subirla.
// Reduce el peso (menos ancho de banda y almacenamiento) manteniendo legible
// el comprobante. Devuelve un File JPEG. Si algo falla, retorna el original.

const MAX_DIMENSION = 1600 // px (lado mayor)
const QUALITY = 0.75

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  try {
    const bitmap = await createImageBitmap(file)

    let { width, height } = bitmap
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY),
    )
    if (!blob) return file

    // Si la "compresión" no ayudó (imagen ya pequeña), conservar el original.
    if (blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
