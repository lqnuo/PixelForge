export {}

declare global {
  interface Window {
    api: {
      image: {
        upload: (items: Array<{
          filename: string
          mimeType: string
          sizeBytes: number
          width?: number
          height?: number
          dataBase64: string
        }>) => Promise<Array<any>>
        list: () => Promise<Array<any>>
      }
      job: {
        create: (params: { imageId: string; styleId?: string | null; aspectRatio: string }) => Promise<any>
      }
      result: {
        listByImage: (imageId: string) => Promise<Array<any>>
      }
      file: {
        download: (resultId: string, suggestedName?: string) => Promise<{ ok?: boolean; filePath?: string; canceled?: boolean; error?: string }>
      }
    }
  }
}

