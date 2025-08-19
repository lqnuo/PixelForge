import { useEffect, useMemo, useState } from 'react'

type ImageItem = {
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

type StyleItem = { id: string; name: string; description?: string | null }

function dataUrl(mime: string, base64?: string | null) {
  if (!base64) return ''
  return `data:${mime};base64,${base64}`
}

function App(): React.JSX.Element {
  const [images, setImages] = useState<ImageItem[]>([])
  const [styles, setStyles] = useState<StyleItem[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)
  const [aspect, setAspect] = useState<'1:1' | '3:4'>('1:1')
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    window.api.image.list().then(setImages)
    window.api.style.list().then(setStyles)
  }, [])

  useEffect(() => {
    if (!selectedImageId) return
    window.api.result.listByImage(selectedImageId).then(setResults)
  }, [selectedImageId])

  useEffect(() => {
    // Listen to background job events and refresh results when relevant
    const offResult = window.api.events?.onResultCreated?.(async (p: any) => {
      if (selectedImageId && p?.sourceImageId === selectedImageId) {
        setResults(await window.api.result.listByImage(selectedImageId))
      }
    })
    const offJob = window.api.events?.onJobUpdated?.(async (_p: any) => {
      if (selectedImageId) {
        setResults(await window.api.result.listByImage(selectedImageId))
      }
    })
    return () => {
      try { offResult && offResult() } catch {}
      try { offJob && offJob() } catch {}
    }
  }, [selectedImageId])

  const selectedImage = useMemo(() => images.find((i) => i.id === selectedImageId) || null, [images, selectedImageId])

  async function handleUpload(evt: React.ChangeEvent<HTMLInputElement>) {
    const files = evt.target.files
    if (!files || files.length === 0) return
    const items: any[] = []
    for (const f of Array.from(files)) {
      const arr = await f.arrayBuffer()
      const base64 = Buffer.from(arr).toString('base64')
      // naive preview: use original as preview for now
      items.push({
        filename: f.name,
        mimeType: f.type || 'image/png',
        sizeBytes: f.size,
        dataBase64: base64,
        previewBase64: base64,
      })
    }
    const res = await window.api.image.upload(items)
    setImages(await window.api.image.list())
    if (res?.[0]?.id) setSelectedImageId(res[0].id)
    evt.currentTarget.value = ''
  }

  async function handleGenerate() {
    if (!selectedImageId) return
    await window.api.job.create({ imageId: selectedImageId, styleId: selectedStyleId, aspectRatio: aspect })
    // simple poll refresh
    setTimeout(async () => {
      setResults(await window.api.result.listByImage(selectedImageId))
    }, 400)
  }

  return (
    <div className="h-full w-full grid grid-cols-12">
      {/* Left: images + upload */}
      <div className="col-span-3 border-r p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">待处理</div>
          <label className="px-3 py-1.5 text-sm rounded bg-black text-white cursor-pointer hover:opacity-90">
            上传
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
        <div className="space-y-2 overflow-auto" style={{ maxHeight: 'calc(100vh - 90px)' }}>
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelectedImageId(img.id)}
              className={`w-full flex items-center gap-2 rounded p-2 border hover:bg-neutral-50 ${selectedImageId === img.id ? 'ring-2 ring-black' : ''}`}
            >
              <img src={dataUrl(img.mimeType, img.previewBase64)} className="h-12 w-12 object-cover rounded" />
              <div className="text-left">
                <div className="text-sm font-medium line-clamp-1">{img.filename || img.id}</div>
                <div className="text-xs text-neutral-500">{(img.sizeBytes / 1024).toFixed(0)} KB</div>
              </div>
            </button>
          ))}
          {images.length === 0 && <div className="text-sm text-neutral-500">请先上传图片</div>}
        </div>
      </div>

      {/* Middle: config */}
      <div className="col-span-4 border-r p-4 space-y-4">
        <div className="font-semibold">配置</div>
        <div>
          <div className="text-sm mb-2">风格预设</div>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <button
                key={s.id}
                className={`px-3 py-1.5 text-sm rounded border ${selectedStyleId === s.id ? 'bg-black text-white' : 'hover:bg-neutral-50'}`}
                onClick={() => setSelectedStyleId(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm mb-2">尺寸比例</div>
          <div className="flex gap-2">
            {(['1:1', '3:4'] as const).map((a) => (
              <button
                key={a}
                className={`px-3 py-1.5 text-sm rounded border ${aspect === a ? 'bg-black text-white' : 'hover:bg-neutral-50'}`}
                onClick={() => setAspect(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <button
            disabled={!selectedImageId}
            onClick={handleGenerate}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            开始生成
          </button>
        </div>
      </div>

      {/* Right: results */}
      <div className="col-span-5 p-4 space-y-4">
        <div className="font-semibold">结果预览</div>
        <div className="space-y-3 overflow-auto" style={{ maxHeight: 'calc(100vh - 90px)' }}>
          {results.map((r) => (
            <div key={r.id} className="border rounded p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">原图</div>
                  {selectedImage && (
                    <img src={dataUrl(selectedImage.mimeType, selectedImage.previewBase64)} className="w-full object-contain rounded" />
                  )}
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">效果图</div>
                  <img src={dataUrl(r.mimeType, r.previewBase64)} className="w-full object-contain rounded" />
                </div>
              </div>
              <div className="mt-2">
                <button
                  className="px-3 py-1.5 text-sm rounded border hover:bg-neutral-50"
                  onClick={() => window.api.file.download(r.id, `${selectedImage?.filename || r.id}`)}
                >
                  下载
                </button>
              </div>
            </div>
          ))}
          {selectedImageId && results.length === 0 && (
            <div className="text-sm text-neutral-500">无生成结果，请点击“开始生成”</div>
          )}
          {!selectedImageId && <div className="text-sm text-neutral-500">请选择一张图片</div>}
        </div>
      </div>
    </div>
  )
}

export default App
