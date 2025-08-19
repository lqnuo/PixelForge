import { createHash } from 'crypto'

export function sha256(buf: Buffer): string {
  const h = createHash('sha256')
  h.update(buf)
  return h.digest('hex')
}

