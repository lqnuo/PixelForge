export type ImageItem = {
  id: string
  filename: string | null
  mimeType: string
  sizeBytes: number
  width?: number | null
  height?: number | null
  sha256: string
  previewBase64?: string | null
  createdAt: number
}

export type StyleItem = { id: string; name: string; description?: string | null }

