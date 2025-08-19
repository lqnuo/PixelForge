<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import type { ImageItem } from '@/types'
import Pagination from '@/components/ui/Pagination.vue'

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

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const jobs = ref<JobItem[]>([])
const selected = ref<Set<string>>(new Set())
const statusFilter = ref<string | null>(null)
const images = ref<ImageItem[]>([])

const imageMap = computed(() => new Map(images.value.map((i) => [i.id, i])))
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

async function fetchJobs() {
  const res = await bridge.job.list({ page: page.value, pageSize: pageSize.value, status: statusFilter.value })
  jobs.value = res.items
  total.value = res.total
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

function isChecked(id: string) { return selected.value.has(id) }
function toggle(id: string, checked: boolean) { if (checked) selected.value.add(id); else selected.value.delete(id) }

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
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="toolbar flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button class="btn btn-outline" :disabled="selected.size===0" @click="retrySelected">重试所选</button>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs px-2 py-1 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">共 {{ total }} 个任务</span>
        <select v-model="statusFilter" @change="fetchJobs" class="select min-w-28">
          <option :value="null">全部状态</option>
          <option value="queued">排队中</option>
          <option value="processing">处理中</option>
          <option value="done">已完成</option>
          <option value="failed">失败</option>
        </select>
      </div>
    </div>

    <div class="flex-1 overflow-auto">
      <div class="grid grid-cols-12 p-3 text-sm font-medium text-neutral-500">
        <div class="col-span-1"><input type="checkbox" @change="(e:any)=>toggleAllOnPage(e.target.checked)" /></div>
        <div class="col-span-3">图片</div>
        <div class="col-span-2">风格</div>
        <div class="col-span-1">尺寸</div>
        <div class="col-span-2">状态</div>
        <div class="col-span-2">时间</div>
        <div class="col-span-1">操作</div>
      </div>
      <div v-for="j in jobs" :key="j.id" class="grid grid-cols-12 items-center px-3 py-2 border-t hover:bg-[hsl(var(--muted))] transition-colors">
        <div class="col-span-1"><input type="checkbox" :checked="isChecked(j.id)" @change="(e:any)=>toggle(j.id,e.target.checked)" /></div>
        <div class="col-span-3 flex items-center gap-2">
          <img v-if="imageMap.get(j.sourceImageId)?.previewBase64" :src="dataUrl(imageMap.get(j.sourceImageId)!.mimeType, imageMap.get(j.sourceImageId)!.previewBase64)" class="h-10 w-10 object-cover rounded" />
          <div class="line-clamp-1">{{ imageMap.get(j.sourceImageId)?.filename || j.sourceImageId }}</div>
        </div>
        <div class="col-span-2">{{ j.styleId || '—' }}</div>
        <div class="col-span-1">{{ j.aspectRatio }}</div>
        <div class="col-span-2">
          <span v-if="j.status==='done'" class="badge-success">已完成</span>
          <span v-else-if="j.status==='failed'" class="badge-danger">失败</span>
          <span v-else-if="j.status==='processing'" class="badge">处理中</span>
          <span v-else class="badge-warn">排队中</span>
        </div>
        <div class="col-span-2">{{ new Date(j.createdAt*1000).toLocaleString() }}</div>
        <div class="col-span-1 flex gap-1">
          <button class="btn btn-outline !px-2 !py-1" @click="bridge.job.retry(j.id)">重试</button>
          <button class="btn btn-outline !px-2 !py-1" @click="downloadFirstResult(j.id)">下载</button>
        </div>
      </div>
      <div v-if="jobs.length===0" class="p-6 text-sm text-neutral-500">暂无任务</div>

    </div>
    <!-- 分页：紧跟表格容器之后（容器外，视觉上在表格下面） -->
    <div v-if="pageCount > 1" class="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <Pagination v-model:page="page" :page-count="pageCount" />
    </div>
  </div>
</template>

<style scoped></style>
