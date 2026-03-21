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
            <template v-if="!msg.type || msg.type === 'text'">
              <div class="message-bubble" v-if="msg.content">
                {{ msg.content }}
              </div>
            </template>
            
            <template v-else-if="msg.type === 'structure-card'">
              <div class="structure-card" :class="{ 'is-confirmed': msg.confirmed }">
                <div class="card-header">
                  <div class="header-title">
                    <Sparkles class="header-icon" />
                    <h4>教学要素提取</h4>
                  </div>
                  <div v-if="msg.confirmed" class="status-badge success"><CheckCircle class="status-icon"/> 已确认</div>
                  <div v-else class="status-badge pending"><Clock class="status-icon"/> 待确认</div>
                </div>
                <div class="card-body">
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">课程主题</span>
                      <span class="info-val">{{ msg.data.topic }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">学生对象</span>
                      <span class="info-val">{{ msg.data.audience }}</span>
                    </div>
                    <div class="info-item full-width">
                      <span class="info-label">教学目标</span>
                      <span class="info-val">{{ msg.data.goal }}</span>
                    </div>
                    <div class="info-item full-width">
                      <span class="info-label">知识点清单</span>
                      <ul class="info-list">
                        <li v-for="(point, pIdx) in msg.data.points" :key="pIdx">{{ point }}</li>
                      </ul>
                    </div>
                    <div class="info-item full-width">
                      <span class="info-label">重难点分析</span>
                      <div class="info-val">
                        <div><strong>重点:</strong> {{ msg.data.focus }}</div>
                        <div style="margin-top:4px;"><strong>难点:</strong> {{ msg.data.difficulty }}</div>
                      </div>
                    </div>
                    <div class="info-item full-width">
                      <span class="info-label">大致逻辑顺序</span>
                      <span class="info-val">{{ msg.data.sequence }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="card-action" v-if="!msg.confirmed">
                  <button class="confirm-btn" @click="confirmStructure(msg)">
                    <Check class="btn-icon" /> 确认以上信息并开始生成
                  </button>
                </div>
              </div>
            </template>
            
            <template v-else-if="msg.type === 'progress-card'">
              <div class="progress-card">
                <div class="card-header">
                  <div class="header-title">
                    <CheckCircle class="header-icon success-icon" v-if="msg.isComplete" />
                    <Wand2 class="header-icon" v-else />
                    <h4>{{ msg.isComplete ? '教案与 PPT 生成完成' : 'AI 智能生成中...' }}</h4>
                  </div>
                </div>
                <div class="card-body">
                  <div class="timeline">
                    <div 
                      v-for="(step, sIdx) in msg.steps" 
                      :key="sIdx"
                      class="timeline-item"
                      :class="{ 
                        'is-completed': sIdx < msg.currentStepIndex, 
                        'is-active': sIdx === msg.currentStepIndex,
                        'is-pending': sIdx > msg.currentStepIndex
                      }"
                    >
                      <div class="timeline-tail" v-if="sIdx < msg.steps.length - 1"></div>
                      <div class="timeline-node">
                        <Check v-if="sIdx < msg.currentStepIndex" class="node-icon check" />
                        <Loader2 v-else-if="sIdx === msg.currentStepIndex" class="node-icon spin" />
                        <div v-else class="node-dot"></div>
                      </div>
                      <div class="timeline-content">
                        {{ step.name }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            
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
  User, Bot, FileText, Loader2, X, Sparkles, CheckCircle, Clock, Check, Wand2
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
    type: 'text',
    content,
    attachments: attachments.length > 0 ? attachments : undefined
  })
  
  const isTriggerKeyword = content.includes('开始生成')
  
  inputText.value = ''
  pendingAttachments.value = []
  
  scrollToBottom()
  
  setTimeout(() => {
    if (isTriggerKeyword) {
      messages.value.push({
        role: 'ai',
        type: 'structure-card',
        confirmed: false,
        data: {
          topic: '高一数学 - 函数的引入与基本概念',
          audience: '高一新生（具有初中代数浅层基础）',
          goal: '理解函数的映射本质，掌握定义域、值域基本知识。',
          points: ['1. 常规与映射的区别', '2. 定义域求解准则', '3. 解析式书写'],
          focus: '从初中变量观念过渡到高中映射观念。',
          difficulty: '抽象函数的理解与定义域求解。',
          sequence: '生活情境引入 -> 知识回顾对比 -> 引出新定义 -> 重难点解析 -> 练习'
        }
      })
    } else {
      messages.value.push({
        role: 'ai',
        type: 'text',
        content: '请确认教学对象和目标是否完善。若您已准备好，请输入“开始生成”。'
      })
    }
    scrollToBottom()
  }, 800)
}

const confirmStructure = (msg) => {
  msg.confirmed = true
  
  setTimeout(() => {
    // 1. 发送进度卡片
    const progressMsg = {
      role: 'ai',
      type: 'progress-card',
      currentStepIndex: 0,
      isComplete: false,
      steps: [
        { name: '整理生成计划' },
        { name: '检索本地知识库中...' },
        { name: '生成教案中...' },
        { name: '生成配套PPT和互动小游戏' }
      ]
    }
    messages.value.push(progressMsg)
    scrollToBottom()
    
    // 2. 模拟服务器流式下发 SSE 的进度推演
    const simulateSSE = async () => {
      const delays = [1200, 1500, 2500, 1500] // 稍微加快一点演示节奏
      // 取出被 Vue 包装过后的响应式代理对象，解决原始对象变动不触发渲染的 Bug
      const reactiveMsg = messages.value[messages.value.length - 1]
      
      for (let i = 0; i < delays.length; i++) {
        await new Promise(resolve => setTimeout(resolve, delays[i]))
        reactiveMsg.currentStepIndex = i + 1
      }
      reactiveMsg.isComplete = true
      
      // 3. 最终完结的总结性口吻消息
      setTimeout(() => {
        messages.value.push({
          role: 'ai',
          type: 'text',
          content: '这是一份根据您的需求生成的《高一数学 - 函数的引入》教案与配套 PPT，右侧资料区已同步更新。您看看是否需要对某些环节进行调整？'
        })
        scrollToBottom()
      }, 600)
    }
    simulateSSE()
    
  }, 600)
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

/* Structure Card */
.structure-card {
  background-color: #ffffff;
  border: 1px solid var(--primary-color);
  border-radius: 12px;
  width: 480px;
  max-width: 100%;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  margin-bottom: 8px;
}
.structure-card.is-confirmed {
  border-color: var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.card-header {
  background-color: rgba(79, 70, 229, 0.05);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(79, 70, 229, 0.1);
  transition: all 0.4s ease;
}
.structure-card.is-confirmed .card-header {
  background-color: #f8fafc;
  border-bottom-color: var(--border-color);
}

.header-title {
  display: flex;
  align-items: center;
}
.header-icon {
  width: 16px;
  height: 16px;
  color: var(--primary-hover);
  margin-right: 8px;
}
.structure-card.is-confirmed .header-icon {
  color: var(--text-secondary);
}
.card-header h4 {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
  font-weight: 600;
  transition: color 0.4s ease;
}
.structure-card.is-confirmed .card-header h4 {
  color: var(--text-secondary);
}

.status-badge {
  font-size: 12px;
  display: flex;
  align-items: center;
  font-weight: 500;
}
.status-badge.pending {
  color: #fbbf24;
}
.status-badge.success {
  color: #10b981;
}
.status-icon {
  width: 14px;
  height: 14px;
  margin-right: 4px;
}

.card-body {
  padding: 16px;
  transition: opacity 0.4s ease;
}
.structure-card.is-confirmed .card-body {
  opacity: 0.8;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.info-item {
  display: flex;
  flex-direction: column;
}
.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-weight: 500;
}
.info-val {
  font-size: 13px;
  color: var(--text-main);
  line-height: 1.5;
}
.info-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--text-main);
  line-height: 1.5;
}
.info-list li {
  margin-bottom: 2px;
}

.card-action {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  background-color: #fafafa;
}

.confirm-btn {
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
  transition: all 0.2s;
}
.confirm-btn:hover {
  background-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
}

/* Progress Card & Timeline */
.progress-card {
  background-color: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 320px;
  max-width: 100%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  overflow: hidden;
  margin-bottom: 8px;
}
.progress-card .card-header {
  background-color: transparent;
  padding: 14px 16px 8px;
  border-bottom: none;
}
.header-icon.success-icon {
  color: #10b981;
}
.progress-card .card-body {
  padding: 0 20px 20px 20px;
  opacity: 1;
}

.timeline {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}
.timeline-item {
  position: relative;
  padding-bottom: 20px;
  display: flex;
  align-items: flex-start;
}
.timeline-item:last-child {
  padding-bottom: 0;
}
.timeline-tail {
  position: absolute;
  left: 11px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background-color: #e2e8f0;
  transition: background-color 0.4s ease;
}
.timeline-item.is-completed .timeline-tail {
  background-color: var(--primary-color);
}
.timeline-node {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  border: 2px solid transparent;
  z-index: 1;
  margin-right: 12px;
  transition: all 0.4s ease;
}
.timeline-item.is-pending .timeline-node {
  border-color: #cbd5e1;
}
.timeline-item.is-active .timeline-node {
  color: var(--primary-color);
  background-color: #eef2ff;
}
.timeline-item.is-completed .timeline-node {
  background-color: var(--primary-color);
  color: white;
}
.node-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #cbd5e1;
}
.node-icon.check {
  width: 12px;
  height: 12px;
  stroke-width: 3;
}
.node-icon.spin {
  animation: spin 1s linear infinite;
}
.timeline-content {
  font-size: 13px;
  font-weight: 500;
  line-height: 24px;
  margin-top: -1px;
  transition: color 0.4s ease;
}
.timeline-item.is-pending .timeline-content {
  color: var(--text-disabled);
}
.timeline-item.is-active .timeline-content {
  color: var(--primary-hover);
  font-weight: 600;
}
.timeline-item.is-completed .timeline-content {
  color: var(--text-main);
}
</style>
