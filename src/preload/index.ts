import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  image: {
    upload: (
      items: Array<{
        filename: string
        mimeType: string
        sizeBytes: number
        width?: number
        height?: number
        dataBase64: string
      }>
    ) => ipcRenderer.invoke('image.upload', { items }),
    list: () => ipcRenderer.invoke('image.list'),
    delete: (imageId: string) => ipcRenderer.invoke('image.delete', { imageId })
  },
  job: {
    create: (params: { imageId: string; styleId?: string | null; aspectRatio: string }) =>
      ipcRenderer.invoke('job.create', params),
    listByImage: (imageId: string) => ipcRenderer.invoke('job.listByImage', { imageId }),
    retry: (jobId: string) => ipcRenderer.invoke('job.retry', { jobId })
  },
  result: {
    listByImage: (imageId: string) => ipcRenderer.invoke('result.listByImage', { imageId }),
    listByJob: (jobId: string) => ipcRenderer.invoke('result.listByJob', { jobId })
  },
  style: {
    list: () => ipcRenderer.invoke('style.list')
  },
  file: {
    download: (resultId: string, suggestedName?: string) =>
      ipcRenderer.invoke('file.download', { resultId, suggestedName })
    ,
    openDownloadsDir: () => ipcRenderer.invoke('file.openDownloadsDir')
  },
  db: {
    clear: (confirmToken: string) => ipcRenderer.invoke('db.clear', { confirmToken })
  },
  events: {
    onJobUpdated: (cb: (payload: any) => void) => {
      const listener = (_: any, payload: any) => cb(payload)
      ipcRenderer.on('job.updated', listener)
      return () => ipcRenderer.removeListener('job.updated', listener)
    },
    onResultCreated: (cb: (payload: any) => void) => {
      const listener = (_: any, payload: any) => cb(payload)
      ipcRenderer.on('result.created', listener)
      return () => ipcRenderer.removeListener('result.created', listener)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
