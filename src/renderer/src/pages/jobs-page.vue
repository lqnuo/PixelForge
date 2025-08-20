<script setup lang="ts">
import { onMounted, ref, computed, watch, h } from 'vue'
import type { ImageItem } from '@/types'
import Pagination from '@/components/ui/Pagination.vue'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const bridge: any = (window as any)?.api

type JobItem = {
  id: string
  sourceImageId: string
  styleId?: string | null
  aspectRatio: string
  status: string
  error?: string | null
  createdAt: number
  updatedAt: number
}

type ResultPreview = { mimeType: string; previewBase64: string }
type TableRow = JobItem & { firstResult: ResultPreview | null }

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const jobs = ref<JobItem[]>([])
const selected = ref<Set<string>>(new Set())
const statusFilter = ref<string | null>(null)
const images = ref<ImageItem[]>([])

const imageMap = computed(() => new Map(images.value.map((i) => [i.id, i])))
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const allChecked = computed(() => jobs.value.length > 0 && jobs.value.every((j) => selected.value.has(j.id)))

const resultPreviewMap = ref<Map<string, ResultPreview>>(new Map())
const tableData = computed<TableRow[]>(() =>
  jobs.value.map((j) => ({ ...j, firstResult: resultPreviewMap.value.get(j.id) ?? null }))
)

async function fetchJobs() {
  const res = await bridge.job.list({ page: page.value, pageSize: pageSize.value, status: statusFilter.value || null })
  jobs.value = res.items
  total.value = res.total
  await loadPreviewsForJobs()
}

async function loadPreviewsForJobs() {
  const entries: [string, ResultPreview][] = []
  await Promise.all(
    jobs.value.map(async (j) => {
      try {
        const list: any[] = await bridge.result.listByJob(j.id)
        const first = list?.[0]
        if (first?.previewBase64) {
          entries.push([j.id, { mimeType: first.mimeType, previewBase64: first.previewBase64 }])
        }
      } catch {}
    })
  )
  const m = new Map<string, ResultPreview>()
  for (const [k, v] of entries) m.set(k, v)
  resultPreviewMap.value = m
}

onMounted(async () => {
  images.value = await bridge.image.list()
  await fetchJobs()
})

watch(page, async () => {
  await fetchJobs()
})

function toggleAllOnPage(checked: boolean) {
  for (const it of jobs.value) {
    if (checked) selected.value.add(it.id)
    else selected.value.delete(it.id)
  }
}

function isChecked(id: string) {
  return selected.value.has(id)
}
function toggle(id: string, checked: boolean) {
  if (checked) selected.value.add(id)
  else selected.value.delete(id)
}

async function retrySelected() {
  for (const id of Array.from(selected.value)) {
    await bridge.job.retry(id)
  }
  await fetchJobs()
}

function dataUrl(mime: string, base64?: string | null) {
  if (!base64) return ''
  return `data:${mime};base64,${base64}`
}

async function downloadFirstResult(jobId: string) {
  const results = await bridge.result.listByJob(jobId)
  if (results?.[0]) {
    const img = imageMap.value.get(results[0].sourceImageId)
    await bridge.file.download(results[0].id, img?.filename || results[0].id)
  } else {
    alert('该任务暂无结果')
  }
}

// === TanStack Table ===
// Removed TanStack table; rendering with shadcn-vue Table components
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="toolbar flex items-center justify-between px-3 py-2">
      <div class="flex items-center gap-2">
        <Button variant="outline" :disabled="selected.size===0" @click="retrySelected">重试所选</Button>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs px-2 py-1 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">共 {{ total }} 个任务</span>
        <Select v-model="(statusFilter as any)" @update:modelValue="fetchJobs">
          <SelectTrigger class="min-w-28"><SelectValue placeholder="全部状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部状态</SelectItem>
            <SelectItem value="queued">排队中</SelectItem>
            <SelectItem value="processing">处理中</SelectItem>
            <SelectItem value="done">已完成</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div class="flex-1 overflow-auto">
      <Table class="w-full text-sm">
        <TableHeader>
          <TableRow>
            <TableHead class="w-10">
              <input type="checkbox" :checked="allChecked" @change="(e:any)=>toggleAllOnPage(!!e?.target?.checked)" />
            </TableHead>
            <TableHead>原图片</TableHead>
            <TableHead>生成图片</TableHead>
            <TableHead>风格</TableHead>
            <TableHead>尺寸</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>时间</TableHead>
            <TableHead class="w-32">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in tableData" :key="row.id" class="hover:bg-[hsl(var(--muted))] transition-colors">
            <TableCell>
              <input type="checkbox" :checked="isChecked(row.id)" @change="(e:any)=>toggle(row.id, !!e?.target?.checked)" />
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <div class="relative inline-block group">
                  <template v-if="imageMap.get(row.sourceImageId)?.previewBase64">
                    <img :src="dataUrl(imageMap.get(row.sourceImageId)!.mimeType, imageMap.get(row.sourceImageId)!.previewBase64)" class="h-10 w-10 object-cover rounded" />
                    <div class="absolute left-0 top-full mt-2 hidden group-hover:block z-50 p-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl">
                      <img :src="dataUrl(imageMap.get(row.sourceImageId)!.mimeType, imageMap.get(row.sourceImageId)!.previewBase64)" class="max-w-80 max-h-80 object-contain rounded" />
                    </div>
                  </template>
                  <div v-else class="h-10 w-10 rounded bg-[hsl(var(--muted))]" />
                </div>
                <div class="line-clamp-1">{{ imageMap.get(row.sourceImageId)?.filename || row.sourceImageId }}</div>
              </div>
            </TableCell>
            <TableCell>
              <template v-if="row.firstResult">
                <div class="relative inline-block group">
                  <img :src="dataUrl(row.firstResult!.mimeType, row.firstResult!.previewBase64)" class="h-10 w-10 object-cover rounded" />
                  <div class="absolute left-0 top/full mt-2 hidden group-hover:block z-50 p-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl">
                    <img :src="dataUrl(row.firstResult!.mimeType, row.firstResult!.previewBase64)" class="max-w-80 max-h-80 object-contain rounded" />
                  </div>
                </div>
              </template>
              <span v-else class="text-neutral-400">—</span>
            </TableCell>
            <TableCell>{{ row.styleId || '—' }}</TableCell>
            <TableCell>{{ row.aspectRatio }}</TableCell>
            <TableCell>
              <span v-if="row.status==='done'" class="badge-success">已完成</span>
              <span v-else-if="row.status==='failed'" class="badge-danger">失败</span>
              <span v-else-if="row.status==='processing'" class="badge">处理中</span>
              <span v-else class="badge-warn">排队中</span>
            </TableCell>
            <TableCell>{{ new Date(row.createdAt * 1000).toLocaleString() }}</TableCell>
            <TableCell>
              <div class="flex gap-1">
                <Button variant="outline" class="!px-2 !py-1" @click="bridge.job.retry(row.id)">重试</Button>
                <Button variant="outline" class="!px-2 !py-1" @click="downloadFirstResult(row.id)">下载</Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="tableData.length===0">
            <TableCell :colspan="8" class="text-center text-neutral-500 p-6">暂无任务</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <!-- 分页：紧跟表格容器之后（容器外，视觉上在表格下面） -->
    <div v-if="pageCount > 1" class="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <Pagination v-model:page="page" :page-count="pageCount" />
    </div>
  </div>
</template>

<style scoped></style>
