<template>
  <div class="context-container">
    <div class="context-header">
      <h3>资料与生成结果</h3>
      <button class="icon-btn"><Settings2 class="btn-icon" /></button>
    </div>
    <div class="context-body">
      
      <div class="section">
        <div class="section-title">
          <span>课件与教案</span>
          <span class="badge">1</span>
        </div>
        <div class="card-list">
          <div class="card file-card" @click="openPreview('《函数的引入》初稿教案.docx')">
            <div class="icon-wrapper pdf-icon">
              <FileText class="file-icon" />
            </div>
            <div class="file-info">
              <div class="file-name" title="《函数的引入》初稿教案.docx">《函数的引入》初稿教案.docx</div>
              <div class="file-meta">
                <span class="file-status success">新生成</span>
                <span class="file-size">14KB</span>
              </div>
            </div>
            <button class="more-btn" @click.stop><MoreVertical class="more-icon" /></button>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span>知识库文件</span>
          <span class="badge">{{ knowledgeFiles.length }}</span>
          <div style="flex:1"></div>
          <button class="icon-btn upload-btn" @click="triggerUpload" :disabled="!activePlanId">
             <Upload class="btn-icon-small" /> 上传
          </button>
          <input type="file" ref="fileInput" style="display:none" @change="handleFileUpload" />
        </div>
        <div class="card-list">
          <!-- 动态渲染空状态 -->
          <div class="card empty-card" v-if="knowledgeFiles.length === 0">
            <div class="empty-card-content">
              <Database class="empty-icon" />
              <span>该计划下暂无知识库文件</span>
            </div>
          </div>
          
          <div class="card file-card" v-for="file in knowledgeFiles" :key="file.id" @click="openKnowledgeFile(file)">
            <div class="icon-wrapper" :class="getFileIconClass(file.extension)">
              <component :is="getFileIcon(file.extension)" class="file-icon" />
            </div>
            <div class="file-info">
              <div class="file-name" :title="file.original_name">{{ file.original_name }}</div>
              <div class="file-meta">
                <span class="file-status" :class="getStatusClass(file.status)">
                  <Loader2 v-if="['uploaded', 'indexing'].includes(file.status)" class="spin-icon" />
                  {{ getStatusText(file.status) }}
                </span>
                <span class="file-size">{{ formatBytes(file.size_bytes) }}</span>
              </div>
            </div>
            <button class="more-btn delete-btn" @click.stop="deleteFile(file)" title="删除文件"><Trash2 class="more-icon" /></button>
          </div>
        </div>
      </div>

    </div>
    
    <!-- 弹层预览组件 -->
    <FilePreviewPanel v-model:visible="isPreviewVisible" :fileId="previewFileId" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Settings2, Layers, FileText, Video, MoreVertical, Upload, Trash2, Database, Loader2 } from 'lucide-vue-next'
import FilePreviewPanel from '../FilePreviewPanel/index.vue'
import { useSessionStore } from '@/store/session'
import { storeToRefs } from 'pinia'
import { getKnowledgeFileListAPI, uploadKnowledgeFileAPI, deleteKnowledgeFileAPI } from '@/api/file'
import { ElMessage, ElMessageBox } from 'element-plus'

const sessionStore = useSessionStore()
const { activePlanId } = storeToRefs(sessionStore)

const isPreviewVisible = ref(false)
const previewFileId = ref(null)

const knowledgeFiles = ref([])
const fileInput = ref(null)
let pollTimer = null

const openPreview = (fileId) => {
  previewFileId.value = fileId
  isPreviewVisible.value = true
}

const openKnowledgeFile = (file) => {
  if (['uploaded', 'indexing', 'failed'].includes(file.status)) {
    ElMessage.warning('该文件当前状态由于仍在解析队列中，暂无法预览')
    return
  }
  openPreview(file.id)
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getFileIconClass = (ext) => {
  ext = (ext || '').toLowerCase().replace('.', '')
  if (['doc', 'docx'].includes(ext)) return 'word-icon'
  if (['pdf'].includes(ext)) return 'pdf-icon'
  if (['xls', 'xlsx'].includes(ext)) return 'excel-icon'
  if (['ppt', 'pptx'].includes(ext)) return 'ppt-icon'
  if (['mp4', 'avi', 'mov'].includes(ext)) return 'video-icon'
  return 'default-icon'
}

const getFileIcon = (ext) => {
  ext = (ext || '').toLowerCase().replace('.', '')
  if (['mp4', 'avi', 'mov'].includes(ext)) return Video
  return FileText
}

const getStatusText = (status) => {
  const map = {
    'uploaded': '待解析',
    'indexing': '特征解析中',
    'ready': '已解析',
    'failed': '解析失败',
    'deleted': '已删除'
  }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = {
    'uploaded': 'pending',
    'indexing': 'pending',
    'ready': 'success',
    'failed': 'error'
  }
  return map[status] || ''
}

const fetchFiles = async () => {
  if (!activePlanId.value) {
    knowledgeFiles.value = []
    return
  }
  try {
    const res = await getKnowledgeFileListAPI(activePlanId.value)
    knowledgeFiles.value = res.data || []
    
    // 如果存在正在异步入库向量库的文件，触发轮询
    const hasPending = knowledgeFiles.value.some(f => ['uploaded', 'indexing'].includes(f.status))
    if (hasPending && !pollTimer) {
      startPolling()
    } else if (!hasPending && pollTimer) {
      stopPolling()
    }
  } catch (e) {
    console.error('获取文件列表失败', e)
  }
}

const startPolling = () => {
  if (!pollTimer) {
    pollTimer = setInterval(fetchFiles, 3000)
  }
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

watch(activePlanId, () => {
  stopPolling()
  fetchFiles()
})

onMounted(() => {
  if (activePlanId.value) {
    fetchFiles()
  }
})

onBeforeUnmount(() => {
  stopPolling()
})

const triggerUpload = () => {
  if (fileInput.value) fileInput.value.click()
}

const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (!activePlanId.value) {
    ElMessage.warning('请先选择或新建一个左侧的教学计划')
    return
  }
  
  try {
    const res = await uploadKnowledgeFileAPI(activePlanId.value, file)
    if (res.code === 200 || res.data) {
      ElMessage.success('上传成功，已加入异步解析队列')
      fetchFiles()
    } else {
      ElMessage.error(res.msg || '上传失败')
    }
  } catch(error) {
    console.error(error)
    ElMessage.error('上传出错')
  } finally {
    e.target.value = ''
  }
}

const deleteFile = async (file) => {
  try {
    await ElMessageBox.confirm(`确认删除知识文件 "${file.original_name}" 吗？此操作不可逆。`, '删除确认', { type: 'warning' })
    await deleteKnowledgeFileAPI(file.id)
    ElMessage.success('删除成功')
    fetchFiles()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('删除失败')
    }
  }
}
</script>

<style scoped>
.context-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.context-header {
  height: var(--header-height);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: var(--bg-context);
}

.context-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}
.icon-btn:hover {
  background-color: #f1f5f9;
  color: var(--text-main);
}
.btn-icon {
  width: 18px;
  height: 18px;
}

.context-body {
  flex: 1;
  padding: 24px 20px;
  overflow-y: auto;
  background-color: var(--bg-context);
}

.section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
  letter-spacing: 0.5px;
}

.badge {
  background-color: #f1f5f9;
  color: var(--text-secondary);
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
  font-weight: 500;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.card:hover {
  box-shadow: 0 8px 16px -4px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025);
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.empty-card {
  border: 1px dashed #cbd5e1;
  background-color: #f8fafc;
  cursor: default;
}
.empty-card:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--text-disabled);
}

.empty-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
  padding: 16px 0;
  font-size: 13px;
}
.empty-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.file-card {
  display: flex;
  align-items: flex-start;
  padding: 14px 16px;
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.pdf-icon {
  background-color: #fee2e2;
  color: #ef4444;
}
.video-icon {
  background-color: #e0e7ff;
  color: #4f46e5;
}

.file-icon {
  width: 20px;
  height: 20px;
}

.file-info {
  flex: 1;
  overflow: hidden;
  margin-top: 1px;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.file-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  gap: 12px;
}

.file-status {
  font-weight: 500;
}
.file-status.success {
  color: #10b981;
}
.file-status.pending {
  color: #f59e0b;
}

.file-size {
  color: var(--text-disabled);
}

.more-btn {
  background: transparent;
  border: none;
  color: var(--text-disabled);
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;
  margin-top: -2px;
  margin-right: -8px;
  transition: all 0.2s;
  display: flex;
}
.more-btn:hover {
  color: var(--text-main);
  background-color: #f1f5f9;
}
.more-icon {
  width: 16px;
  height: 16px;
}

/* 追加知识库功能动态样式 */
.upload-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--primary-color);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}
.upload-btn:hover:not(:disabled) {
  background-color: var(--primary-hover);
  color: white;
}
.upload-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}
.btn-icon-small {
  width: 14px;
  height: 14px;
}
.spin-icon {
  width: 12px;
  height: 12px;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 4px;
  vertical-align: middle;
}
.file-status {
  display: flex;
  align-items: center;
}
.file-status.error {
  color: #ef4444;
}
.delete-btn {
  color: #ef4444;
  opacity: 0;
  transition: all 0.2s ease;
}
.card:hover .delete-btn {
  opacity: 0.6;
}
.delete-btn:hover {
  background-color: #fee2e2;
  color: #ef4444 !important;
  opacity: 1 !important;
}

.word-icon { background-color: #eff6ff; color: #3b82f6; }
.excel-icon { background-color: #ecfdf5; color: #10b981; }
.ppt-icon { background-color: #fef2f2; color: #ef4444; }
.pdf-icon { background-color: #fee2e2; color: #ef4444; }
.video-icon { background-color: #e0e7ff; color: #4f46e5; }
.default-icon { background-color: #f1f5f9; color: #64748b; }

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
