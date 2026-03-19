<template>
  <div class="context-container">
    <div class="context-header">
      <h3>资料与生成结果</h3>
    </div>
    <div class="context-body">
      
      <div class="section">
        <div class="section-title">
          <span>课件与教案</span>
        </div>
        <div class="card-list">
          <div class="card item-card empty-card">
            待生成课件与教案
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span>知识库文件</span>
        </div>
        <div class="card-list">
          <div class="card file-card">
            <el-icon class="file-icon"><Document /></el-icon>
            <div class="file-info">
              <div class="file-name">初中物理课程标准.pdf</div>
              <div class="file-status success">已解析</div>
            </div>
          </div>
          <div class="card file-card">
            <el-icon class="file-icon"><VideoCamera /></el-icon>
            <div class="file-info">
              <div class="file-name">牛顿第一定律教学视频.mp4</div>
              <div class="file-status pending">解析中...</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.context-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.context-header {
  height: var(--header-height);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.context-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.context-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  transition: box-shadow 0.2s, border-color 0.2s;
  cursor: pointer;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-color: #c9d3e8;
}

.empty-card {
  color: var(--text-disabled);
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  border-style: dashed;
  background-color: transparent;
  cursor: default;
}
.empty-card:hover {
  box-shadow: none;
  border-color: var(--border-color);
}

.file-card {
  display: flex;
  align-items: center;
}

.file-icon {
  font-size: 24px;
  color: var(--primary-color);
  margin-right: 12px;
}

.file-info {
  flex: 1;
  overflow: hidden;
}

.file-name {
  font-size: 13px;
  color: var(--text-main);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-status {
  font-size: 12px;
}
.file-status.success {
  color: #67c23a;
}
.file-status.pending {
  color: #e6a23c;
}
</style>
