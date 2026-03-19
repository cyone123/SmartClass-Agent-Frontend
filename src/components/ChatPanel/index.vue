<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3>教学对话</h3>
    </div>
    <div class="chat-body">
      <div class="placeholder">
        <el-empty description="当前暂无对话，请在下方输入您的需求" :image-size="100" />
      </div>
    </div>
    <div class="chat-footer">
      <div class="input-area">
        <div class="toolbar">
          <el-button link>
            <el-icon><Link /></el-icon> 附件
          </el-button>
        </div>
        <el-input
          type="textarea"
          :rows="3"
          placeholder="例如：我要给高一学生上一节函数的引入课..."
          resize="none"
        />
        <div class="send-action">
          <el-button type="primary">发送</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  height: var(--header-height);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-main);
  font-weight: 600;
}

.chat-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #fcfcfc;
}

.placeholder {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chat-footer {
  padding: 16px 24px;
  background-color: #ffffff;
  border-top: 1px solid var(--border-color);
}

.input-area {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  transition: border-color 0.2s;
}

.input-area:focus-within {
  border-color: var(--primary-color);
}

.toolbar {
  margin-bottom: 8px;
}

:deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 0;
}
:deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.send-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
