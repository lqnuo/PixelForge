<script setup lang="ts">
import { onMounted, ref, computed, watch, h } from 'vue'
import type { ImageItem } from '@/types'
import Pagination from '@/components/ui/Pagination.vue'
import { createColumnHelper, FlexRender, getCoreRowModel, useVueTable, type ColumnDef } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

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
const columnHelper = createColumnHelper<TableRow>()

  const columns: ColumnDef<TableRow, any>[] = [
  {
    id: 'select',
    header: () =>
      h('input', {
        type: 'checkbox',
        checked: allChecked.value,
        onChange: (e: any) => toggleAllOnPage(!!e?.target?.checked),
      }),
    cell: ({ row }) =>
      h('input', {
        type: 'checkbox',
        checked: isChecked(row.original.id),
        onChange: (e: any) => toggle(row.original.id, !!e?.target?.checked),
      }),
    size: 40,
    enableSorting: false,
  },
  columnHelper.accessor('sourceImageId', {
    id: 'source',
    header: '原图片',
    cell: ({ row }) => {
      const img = imageMap.value.get(row.original.sourceImageId)
      const src = img?.previewBase64 ? dataUrl(img!.mimeType, img!.previewBase64) : ''
      const thumb = img?.previewBase64
        ? h('img', { src, class: 'h-10 w-10 object-cover rounded' })
        : h('div', { class: 'h-10 w-10 rounded bg-[hsl(var(--muted))]' })
      const preview = img?.previewBase64
        ? h(
            'div',
            {
              class:
                'absolute left-0 top-full mt-2 hidden group-hover:block z-50 p-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl',
            },
            [h('img', { src, class: 'max-w-80 max-h-80 object-contain rounded' })]
          )
        : null
      return h('div', { class: 'flex items-center gap-2' }, [
        h('div', { class: 'relative inline-block group' }, [thumb, preview]),
        h('div', { class: 'line-clamp-1' }, img?.filename || row.original.sourceImageId),
      ])
    },
  }),
  {
    id: 'generated',
    header: '生成图片',
    cell: ({ row }) => {
      const r = row.original.firstResult
      if (!r) return h('span', { class: 'text-neutral-400' }, '—')
      const src = dataUrl(r.mimeType, r.previewBase64)
      return h('div', { class: 'relative inline-block group' }, [
        h('img', { src, class: 'h-10 w-10 object-cover rounded' }),
        h(
          'div',
          {
            class:
              'absolute left-0 top-full mt-2 hidden group-hover:block z-50 p-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl',
          },
          [h('img', { src, class: 'max-w-80 max-h-80 object-contain rounded' })]
        ),
      ])
    },
    size: 80,
    enableSorting: false,
  },
  columnHelper.accessor('styleId', {
    header: '风格',
    cell: ({ getValue }) => getValue() || '—',
  }),
  columnHelper.accessor('aspectRatio', {
    header: '尺寸',
  }),
  {
    id: 'status',
    header: '状态',
    cell: ({ row }) => {
      const s = row.original.status
      if (s === 'done') return h('span', { class: 'badge-success' }, '已完成')
      if (s === 'failed') return h('span', { class: 'badge-danger' }, '失败')
      if (s === 'processing') return h('span', { class: 'badge' }, '处理中')
      return h('span', { class: 'badge-warn' }, '排队中')
    },
  },
  {
    id: 'time',
    header: '时间',
    cell: ({ row }) => new Date(row.original.createdAt * 1000).toLocaleString(),
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) =>
      h('div', { class: 'flex gap-1' }, [
        h(Button as any, { variant: 'outline', class: '!px-2 !py-1', onClick: () => bridge.job.retry(row.original.id) }, { default: () => '重试' }),
        h(Button as any, { variant: 'outline', class: '!px-2 !py-1', onClick: () => downloadFirstResult(row.original.id) }, { default: () => '下载' }),
      ]),
    enableSorting: false,
  },
]

const table = useVueTable<TableRow>({
  get data() {
    return tableData.value
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
})
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
      <table class="w-full text-sm border border-[hsl(var(--border))] border-collapse rounded-md">
        <thead>
          <tr v-for="hg in table.getHeaderGroups()" :key="hg.id">
            <th
              v-for="header in hg.headers"
              :key="header.id"
              class="text-left px-3 py-2 text-neutral-500 font-medium align-middle text-xs border border-[hsl(var(--border))]"
              :style="{ width: (header.getSize ? header.getSize() + 'px' : undefined) as any }"
            >
              <div v-if="!header.isPlaceholder">
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in table.getRowModel().rows" :key="row.id" class="hover:bg-[hsl(var(--muted))] transition-colors">
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="px-3 py-2 align-middle border border-[hsl(var(--border))]"
              :style="{ width: (cell.column.getSize ? cell.column.getSize() + 'px' : undefined) as any }"
            >
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="jobs.length===0" class="p-6 text-sm text-neutral-500">暂无任务</div>
    </div>
    <!-- 分页：紧跟表格容器之后（容器外，视觉上在表格下面） -->
    <div v-if="pageCount > 1" class="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <Pagination v-model:page="page" :page-count="pageCount" />
    </div>
  </div>
</template>

<style scoped></style>
