export {}

import type { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      image: {
        upload: (items: Array<{
          filename: string
          mimeType: string
          sizeBytes: number
          width?: number
          height?: number
          dataBase64: string
          previewBase64?: string | null
        }>) => Promise<Array<any>>
        list: (params?: { groupId?: string | null }) => Promise<Array<any>>
        delete: (imageId: string) => Promise<{ ok: boolean; code?: string; message?: string }>
      }
      job: {
        create: (params: { imageId: string; styleId?: string | null; aspectRatio: string }) => Promise<any>
        bulkCreate: (params: { imageIds: string[]; styleId?: string | null; aspectRatio: string }) => Promise<any>
        list: (params?: { page?: number; pageSize?: number; status?: string | null }) => Promise<{ items: any[]; total: number; page: number; pageSize: number }>
        listByImage: (imageId: string) => Promise<Array<any>>
        retry: (jobId: string) => Promise<{ ok: boolean } | { ok: false; code: string; message: string }>
      }
      result: {
        listByImage: (imageId: string) => Promise<Array<any>>
        listByJob: (jobId: string) => Promise<Array<any>>
      }
      style: {
        list: () => Promise<Array<any>>
      }
      file: {
        download: (resultId: string, suggestedName?: string) => Promise<{ ok?: boolean; filePath?: string; canceled?: boolean; error?: string }>
        openDownloadsDir: () => Promise<{ ok: boolean }>
      }
      db: {
        clear: (confirmToken: string) => Promise<{ ok: boolean; code?: string; message?: string }>
      }
      config: {
        getAll: () => Promise<Record<string, string>>
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<{ ok: boolean }>
      }
      events: {
        onJobUpdated: (cb: (payload: any) => void) => () => void
        onResultCreated: (cb: (payload: any) => void) => () => void
      }
    }
  }
}
