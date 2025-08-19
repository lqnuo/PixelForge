export async function withRetry<T>(fn: () => Promise<T> | T, attempts = 3, delayMs = 100): Promise<T> {
  let lastErr: any
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fn()
      return res
    } catch (e) {
      lastErr = e
      if (i < attempts - 1) await sleep(delayMs)
    }
  }
  throw lastErr
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

