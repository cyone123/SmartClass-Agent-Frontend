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
          <span class="badge">2</span>
        </div>
        <div class="card-list">
          <div class="card file-card" @click="openPreview('1')">
            <div class="icon-wrapper pdf-icon">
              <FileText class="file-icon" />
            </div>
            <div class="file-info">
              <div class="file-name" title="初中物理课程标准.pdf">初中物理课程标准.pdf</div>
              <div class="file-meta">
                <span class="file-status success">已解析</span>
                <span class="file-size">2.4 MB</span>
              </div>
            </div>
            <button class="more-btn" @click.stop><MoreVertical class="more-icon" /></button>
          </div>
          <div class="card file-card" @click="openPreview('2')">
            <div class="icon-wrapper video-icon">
              <Video class="file-icon" />
            </div>
            <div class="file-info">
              <div class="file-name" title="牛顿第一定律教学视频.mp4">牛顿第一定律教学视频.mp4</div>
              <div class="file-meta">
                <span class="file-status pending">解析中...</span>
                <span class="file-size">18.5 MB</span>
              </div>
            </div>
            <button class="more-btn" @click.stop><MoreVertical class="more-icon" /></button>
          </div>
        </div>
      </div>

    </div>
    
    <!-- 弹层预览组件 -->
    <FilePreviewPanel v-model:visible="isPreviewVisible" :fileId="previewFileId" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Settings2, Layers, FileText, Video, MoreVertical } from 'lucide-vue-next'
import FilePreviewPanel from '../FilePreviewPanel/index.vue'

const isPreviewVisible = ref(false)
const previewFileId = ref(null)

const openPreview = (fileId) => {
  previewFileId.value = fileId
  isPreviewVisible.value = true
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
</style>
