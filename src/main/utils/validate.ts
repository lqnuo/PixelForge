export function isString(x: any): x is string {
  return typeof x === 'string' && x.length >= 0
}

export function isNumber(x: any): x is number {
  return typeof x === 'number' && Number.isFinite(x)
}

export function isArray<T = unknown>(x: any): x is T[] {
  return Array.isArray(x)
}

export function validateUploadItem(x: any) {
  if (!x || !isString(x.filename) || !isString(x.mimeType) || !isNumber(x.sizeBytes) || !isString(x.dataBase64)) {
    return false
  }
  if (x.width != null && !isNumber(x.width)) return false
  if (x.height != null && !isNumber(x.height)) return false
  if (x.previewBase64 != null && !isString(x.previewBase64)) return false
  return true
}

