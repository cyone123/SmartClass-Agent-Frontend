<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3>教学对话</h3>
      <div class="header-actions">
        <button class="icon-btn"><MoreHorizontal class="btn-icon" /></button>
      </div>
    </div>
    
    <div class="chat-body" ref="chatBodyRef">
      <div v-if="messages.length === 0" class="placeholder">
        <div class="empty-state">
          <div class="empty-icon-wrapper">
            <MessageSquarePlus class="empty-icon" />
          </div>
          <p>当前暂无对话，请在下方输入您的需求</p>
          <span class="empty-hint">您可以要求我生成课件骨架、编写教案，或提供教学参考资料</span>
        </div>
      </div>
      
      <div v-else class="message-list">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          class="message-wrapper"
          :class="msg.role === 'teacher' ? 'message-right' : 'message-left'"
        >
          <div class="avatar" :class="msg.role">
            <User v-if="msg.role === 'teacher'" class="avatar-icon" />
            <Bot v-else class="avatar-icon" />
          </div>
          <div class="message-content">
            <div class="message-bubble" v-if="msg.content">
              {{ msg.content }}
            </div>
            
            <div v-if="msg.attachments && msg.attachments.length > 0" class="message-attachments">
              <div v-for="file in msg.attachments" :key="file.id" class="attachment-card sent-attachment">
                <FileText class="file-icon" />
                <span class="file-name" :title="file.name">{{ file.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-footer">
      <div class="input-container" :class="{ 'has-files': pendingAttachments.length > 0 }">
        <div class="toolbar">
          <button class="tool-btn" title="添加资料 (支持多模态)" @click="handleUploadMock">
            <Paperclip class="tool-icon" />
            <span class="tool-text">资料</span>
          </button>
          <button class="tool-btn" title="教案模板">
            <LayoutTemplate class="tool-icon" />
            <span class="tool-text">模板</span>
          </button>
        </div>
        
        <div class="attachments-preview" v-if="pendingAttachments.length > 0">
          <div v-for="file in pendingAttachments" :key="file.id" class="attachment-card">
            <div v-if="file.status === 'uploading'" class="uploading-spinner">
              <Loader2 class="spinner-icon" />
            </div>
            <FileText v-else class="file-icon" />
            
            <span class="file-name" :title="file.name">{{ file.name }}</span>
            
            <button class="remove-file-btn" @click="removeAttachment(file.id)" v-if="file.status === 'success'">
              <X class="remove-icon" />
            </button>
          </div>
        </div>

        <textarea
          class="chat-input"
          v-model="inputText"
          rows="3"
          placeholder="例如：我要给高一学生上一节函数的引入课..."
          @keydown.enter.prevent="sendMessage"
        ></textarea>
        
        <div class="send-action">
          <button 
            class="send-btn" 
            :disabled="!canSend"
            :class="{ 'is-disabled': !canSend }"
            @click="sendMessage"
            title="发送 (Enter)"
          >
            <Send class="send-icon" />
            <span>发送</span>
          </button>
        </div>
      </div>
      <div class="footer-hint">AI 生成的内容仅供参考，请以实际教学为准</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { 
  MessageSquarePlus, Paperclip, LayoutTemplate, Send, MoreHorizontal, 
  User, Bot, FileText, Loader2, X 
} from 'lucide-vue-next'

const chatBodyRef = ref(null)

const messages = ref([
  // Array of { role: 'teacher' | 'ai', content: string, attachments?: array }
])

const inputText = ref('')
const pendingAttachments = ref([])

const canSend = computed(() => {
  const hasText = inputText.value.trim().length > 0
  const hasReadyFiles = pendingAttachments.value.some(file => file.status === 'success')
  return hasText || hasReadyFiles
})

const handleUploadMock = () => {
  const id = Date.now()
  pendingAttachments.value.push({ 
    id, 
    name: `补充教学资料_${Math.floor(Math.random() * 100)}.pdf`, 
    status: 'uploading' 
  })
  
  // mock delay for upload
  setTimeout(() => {
    const file = pendingAttachments.value.find(f => f.id === id)
    if (file) file.status = 'success'
  }, 1200)
}

const removeAttachment = (id) => {
  const index = pendingAttachments.value.findIndex(f => f.id === id)
  if (index > -1) {
    pendingAttachments.value.splice(index, 1)
  }
}

const sendMessage = () => {
  if (!canSend.value) return
  
  const attachments = pendingAttachments.value.filter(file => file.status === 'success')
  const content = inputText.value.trim()
  
  messages.value.push({
    role: 'teacher',
    content,
    attachments: attachments.length > 0 ? attachments : undefined
  })
  
  inputText.value = ''
  pendingAttachments.value = []
  
  scrollToBottom()
  
  // Mock AI response
  setTimeout(() => {
    messages.value.push({
      role: 'ai',
      content: '请补充教学对象和目标'
    })
    scrollToBottom()
  }, 800)
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}
</script>

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
  justify-content: space-between;
  padding: 0 24px;
  background-color: var(--bg-main);
  z-index: 10;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-main);
  font-weight: 600;
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
  width: 20px;
  height: 20px;
}

.chat-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #fcfcfd;
  scroll-behavior: smooth;
}

/* Empty State */
.placeholder {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.empty-icon-wrapper {
  background-color: #f1f5f9;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.empty-icon {
  width: 32px;
  height: 32px;
  color: #94a3b8;
}
.empty-state p {
  color: var(--text-main);
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 8px 0;
}
.empty-hint {
  color: var(--text-secondary);
  font-size: 13px;
}

/* Messages */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 12px;
}

.message-wrapper {
  display: flex;
  align-items: flex-start;
  max-width: 85%;
}

.message-left {
  align-self: flex-start;
}

.message-right {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar.ai {
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  color: var(--primary-color);
  margin-right: 12px;
}
.avatar.teacher {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: white;
  margin-left: 12px;
}
.avatar-icon {
  width: 20px;
  height: 20px;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-right .message-content {
  align-items: flex-end;
}
.message-left .message-content {
  align-items: flex-start;
}

.message-bubble {
  padding: 10px 16px;
  font-size: 14px;
  line-height: 1.6;
  border-radius: 12px;
  color: var(--text-main);
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message-left .message-bubble {
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  border-top-left-radius: 2px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

.message-right .message-bubble {
  background-color: var(--primary-color);
  color: #ffffff;
  border-top-right-radius: 2px;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

/* Input Area */
.chat-footer {
  padding: 20px 24px;
  background-color: var(--bg-main);
  box-shadow: 0 -4px 12px rgba(0,0,0,0.02);
  z-index: 10;
}

.input-container {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px;
  background-color: #ffffff;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.input-container:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.tool-btn {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}
.tool-btn:hover {
  background-color: #f1f5f9;
  color: var(--text-main);
}
.tool-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.attachments-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  padding: 0 4px;
}

.attachment-card {
  display: flex;
  align-items: center;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-main);
}
.sent-attachment {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-main);
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.message-right .sent-attachment {
  background-color: var(--primary-color);
  border: 1px solid var(--primary-hover);
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}
.message-right .sent-attachment .file-icon {
  color: #ffffff;
}

.spinner-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  color: var(--primary-color);
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}

.file-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  color: var(--text-secondary);
}

.file-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-file-btn {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 50%;
  margin-left: 6px;
  cursor: pointer;
  color: #94a3b8;
  margin-right: -4px;
}
.remove-file-btn:hover {
  background-color: #e2e8f0;
  color: #ef4444;
}
.remove-icon {
  width: 12px;
  height: 12px;
}

.chat-input {
  border: none;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  color: var(--text-main);
  padding: 0 4px;
  background: transparent;
  line-height: 1.5;
  outline: none;
}
.chat-input::placeholder {
  color: var(--text-disabled);
}

.send-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.send-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.send-btn:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
}
.send-btn.is-disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.7;
}

.send-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}

.footer-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-disabled);
  margin-top: 12px;
}
</style>
