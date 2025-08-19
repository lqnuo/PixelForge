import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  image: {
    upload: (items: Array<{ filename: string; mimeType: string; sizeBytes: number; width?: number; height?: number; dataBase64: string }>) =>
      ipcRenderer.invoke('image.upload', { items }),
    list: () => ipcRenderer.invoke('image.list'),
  },
  job: {
    create: (params: { imageId: string; styleId?: string | null; aspectRatio: string }) =>
      ipcRenderer.invoke('job.create', params),
  },
  result: {
    listByImage: (imageId: string) => ipcRenderer.invoke('result.listByImage', { imageId }),
  },
  file: {
    download: (resultId: string, suggestedName?: string) =>
      ipcRenderer.invoke('file.download', { resultId, suggestedName }),
  },
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
