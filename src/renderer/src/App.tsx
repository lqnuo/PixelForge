import { useEffect, useMemo, useState } from 'react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'

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
  const [jobs, setJobs] = useState<any[]>([])
  const [lastError, setLastError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    window.api.image.list().then(setImages)
    window.api.style.list().then(setStyles)
  }, [])

  useEffect(() => {
    if (!selectedImageId) return
    window.api.result.listByImage(selectedImageId).then(setResults)
    window.api.job.listByImage(selectedImageId).then((js) => {
      setJobs(js)
      const failed = js.find((j: any) => j.status === 'failed')
      setLastError(failed?.error || null)
    })
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
        const js = await window.api.job.listByImage(selectedImageId)
        setJobs(js)
        const failed = js.find((j: any) => j.status === 'failed')
        setLastError(failed?.error || null)
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
    await uploadFiles(Array.from(files))
    evt.currentTarget.value = ''
  }

  async function uploadFiles(files: File[]) {
    const items: any[] = []
    for (const f of files) {
      const arr = await f.arrayBuffer()
      const base64 = Buffer.from(arr).toString('base64')
      const preview = await resizePreview(f, 320)
      items.push({
        filename: f.name,
        mimeType: f.type || 'image/png',
        sizeBytes: f.size,
        dataBase64: base64,
        previewBase64: preview,
      })
    }
    const res = await window.api.image.upload(items)
    setImages(await window.api.image.list())
    if (res?.[0]?.id) setSelectedImageId(res[0].id)
  }

  async function handleGenerate() {
    if (!selectedImageId) return
    setIsGenerating(true)
    await window.api.job.create({ imageId: selectedImageId, styleId: selectedStyleId, aspectRatio: aspect })
    // simple poll refresh
    setTimeout(async () => {
      setResults(await window.api.result.listByImage(selectedImageId))
      setIsGenerating(false)
    }, 400)
  }

  async function deleteSelected() {
    if (!selectedImageId) return
    if (!confirm('确定删除该图片及其关联任务与结果？')) return
    const res = await window.api.image.delete(selectedImageId)
    if (res?.ok) {
      const list = await window.api.image.list()
      setImages(list)
      setSelectedImageId(list[0]?.id || null)
      setResults([])
      setJobs([])
      setLastError(null)
    }
  }

  function openDownloadsDir() {
    window.api.file.openDownloadsDir()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Regenerate
      if (selectedImageId && (e.key.toLowerCase() === 'r' || e.key === 'Enter')) {
        e.preventDefault()
        handleGenerate()
        return
      }
      // Delete selected image
      if (selectedImageId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault()
        deleteSelected()
        return
      }
      // Open downloads directory (Ctrl/Cmd + J)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        openDownloadsDir()
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedImageId, selectedStyleId, aspect])

  return (
    <div className="h-full w-full grid grid-cols-12">
      {/* Left: images + upload */}
      <div
        className={`col-span-3 border-r p-3 space-y-3 ${isDragging ? 'bg-neutral-50 ring-2 ring-black' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false)
          const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
          if (files.length) await uploadFiles(files)
        }}
      >
        <div className="flex items-center justify-between">
          <div className="font-semibold">待处理</div>
          <label className="cursor-pointer">
            <Button className="pointer-events-none">上传</Button>
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
          {images.length === 0 && <div className="text-sm text-neutral-500">请先上传图片（支持拖拽）</div>}
        </div>
        <div className="pt-2">
          <Button
            disabled={!selectedImageId}
            onClick={deleteSelected}
            variant="outline"
          >
            删除所选
          </Button>
        </div>
      </div>

      {/* Middle: config */}
      <div className="col-span-4 border-r p-4 space-y-4">
        <div className="font-semibold">配置</div>
        {lastError && (
          <div className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
            出错了：{lastError}
            {jobs.filter((j) => j.status === 'failed').slice(0,1).map((j) => (
              <button
                key={j.id}
                className="ml-3 px-2 py-1 text-xs rounded border border-red-300 hover:bg-red-100"
                onClick={async () => { await window.api.job.retry(j.id); setLastError(null) }}
              >
                重试
              </button>
            ))}
          </div>
        )}
        <div>
          <div className="text-sm mb-2">风格预设</div>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <Button
                key={s.id}
                variant={selectedStyleId === s.id ? 'default' : 'outline'}
                onClick={() => setSelectedStyleId(s.id)}
              >
                {s.name}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm mb-2">尺寸比例</div>
          <div className="flex gap-2">
            {(['1:1', '3:4'] as const).map((a) => (
              <Button
                key={a}
                variant={aspect === a ? 'default' : 'outline'}
                onClick={() => setAspect(a)}
              >
                {a}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Button
            disabled={!selectedImageId || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? '生成中…' : '开始生成'}
          </Button>
        </div>
      </div>

      {/* Right: results */}
      <div className="col-span-5 p-4 space-y-4">
        <div className="font-semibold flex items-center justify-between">
          <span>结果预览</span>
          <button
            className="px-2 py-1 text-xs rounded border hover:bg-neutral-50"
            onClick={openDownloadsDir}
          >
            打开下载目录
          </button>
        </div>
        <div className="space-y-3 overflow-auto" style={{ maxHeight: 'calc(100vh - 90px)' }}>
          {results.map((r) => (
            <Card key={r.id}>
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
                <Button
                  variant="outline"
                  onClick={() => window.api.file.download(r.id, `${selectedImage?.filename || r.id}`)}
                >
                  下载
                </Button>
              </div>
            </Card>
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

async function resizePreview(file: File, maxWidth: number): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, maxWidth / (img.width || 1))
    const w = Math.max(1, Math.round((img.width || maxWidth) * scale))
    const h = Math.max(1, Math.round((img.height || maxWidth) * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    const dataUrl = canvas.toDataURL(file.type || 'image/png', 0.8)
    return dataUrl.split(',')[1] || ''
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = url
  })
}

export default App
