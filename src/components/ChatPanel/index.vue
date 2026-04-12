<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3>教学对话</h3>
      <div class="header-actions">
        <button class="icon-btn"><MoreHorizontal class="btn-icon" /></button>
      </div>
    </div>

    <div class="chat-body" ref="chatBodyRef" @scroll="handleChatScroll">
      <div v-if="messages.length === 0" class="placeholder">
        <div class="empty-state">
          <div class="empty-icon-wrapper">
            <MessageSquarePlus class="empty-icon" />
          </div>
          <p>当前暂无对话，请在下方输入您的需求</p>
          <span class="empty-hint">您可以让我生成教学设计、教案草稿，或结合附件进行分析。</span>
        </div>
      </div>

      <div v-else class="message-list">
        <div
          v-for="(msg, index) in messages"
          :key="msg.runId ? `${msg.runId}_${index}` : index"
          class="message-wrapper"
          :class="msg.role === 'teacher' ? 'message-right' : 'message-left'"
        >
          <div class="avatar" :class="msg.role">
            <User v-if="msg.role === 'teacher'" class="avatar-icon" />
            <Bot v-else class="avatar-icon" />
          </div>

          <div class="message-content">
            <template v-if="!msg.type || msg.type === 'text'">
              <div
                v-if="msg.content || msg.isPending"
                class="message-bubble"
                :class="{ 'is-pending': msg.isPending }"
              >
                <div
                  v-if="msg.isPending"
                  class="message-waiting-dots waiting-dots"
                  aria-label="AI 正在组织回复"
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <template v-else>
                  <AiMarkdownMessage
                    v-if="msg.role === 'ai'"
                    :content="normalizeMessageContent(msg.content)"
                    @rendered="handleAiMessageRendered"
                  />
                  <div v-else class="message-text-content">
                    {{ normalizeMessageContent(msg.content) }}
                  </div>
                </template>
              </div>
            </template>

            <template v-else-if="msg.type === 'progress-status'">
              <div class="progress-status-card" :class="{ 'is-complete': msg.isComplete }">
                <div class="progress-status-header">
                  <span class="progress-status-title">
                    {{ msg.isComplete ? 'Agent 运行完成' : 'Agent 正在处理中' }}
                  </span>
                </div>

                <div class="progress-step-list">
                  <div
                    v-for="step in msg.steps"
                    :key="step.step_key"
                    class="progress-step-item"
                    :class="`is-${step.status}`"
                  >
                    <div class="progress-step-indicator">
                      <div v-if="step.status === 'running'" class="waiting-dots" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <Check v-else-if="step.status === 'success'" class="step-icon success" />
                      <AlertCircle v-else-if="step.status === 'failed'" class="step-icon failed" />
                      <span v-else class="step-dot"></span>
                    </div>

                    <div class="progress-step-body">
                      <div class="progress-step-label">{{ step.label }}</div>
                      <div v-if="step.detail" class="progress-step-detail">{{ step.detail }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <div v-if="msg.attachments && msg.attachments.length > 0" class="message-attachments">
              <div
                v-for="file in msg.attachments"
                :key="file.id || file.uid || file.name"
                class="attachment-card sent-attachment"
              >
                <FileText class="file-icon" />
                <span class="file-name" :title="file.name">{{ file.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-footer">
      <transition name="suggestion-fade">
        <div v-if="showSuggestions" class="suggestion-layer">
          <div class="suggestion-card">
            <div class="suggestion-title">继续追问</div>
            <div class="suggestion-list">
              <button
                v-for="suggestion in activeSuggestions"
                :key="suggestion"
                type="button"
                class="suggestion-chip"
                @click="applySuggestion(suggestion)"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>
        </div>
      </transition>

      <div class="input-container" :class="{ 'has-files': pendingAttachments.length > 0 }">
        <div class="toolbar">
          <button class="tool-btn" title="添加资料" @click="triggerAttachmentUpload">
            <Paperclip class="tool-icon" />
            <span class="tool-text">资料</span>
          </button>
          <button class="tool-btn" title="教案模板">
            <LayoutTemplate class="tool-icon" />
            <span class="tool-text">模板</span>
          </button>
          <input
            ref="attachmentInputRef"
            type="file"
            multiple
            style="display: none"
            @change="handleAttachmentSelect"
          />
        </div>

        <div v-if="pendingAttachments.length > 0" class="attachments-preview">
          <div
            v-for="file in pendingAttachments"
            :key="file.uid"
            class="attachment-card"
            :class="{
              'is-uploading': file.status === 'uploading',
              'is-error': file.status === 'error'
            }"
          >
            <div v-if="file.status === 'uploading'" class="uploading-spinner">
              <Loader2 class="spinner-icon" />
            </div>
            <FileText v-else class="file-icon" />

            <div class="attachment-meta">
              <span class="file-name" :title="file.name">{{ file.name }}</span>
              <span v-if="file.status === 'error'" class="attachment-status-text">
                {{ file.errorMessage || '上传失败' }}
              </span>
            </div>

            <button
              v-if="file.status !== 'uploading'"
              class="remove-file-btn"
              @click="removeAttachment(file.uid)"
            >
              <X class="remove-icon" />
            </button>
          </div>
        </div>

        <textarea
          ref="inputTextareaRef"
          v-model="inputText"
          class="chat-input"
          rows="3"
          placeholder="例如：请帮我为高一数学《函数》设计一节导入课。"
          @keydown.enter.prevent="sendMessage"
        ></textarea>

        <div class="send-action">
          <button
            class="send-btn"
            :disabled="!canSend"
            :class="{ 'is-disabled': !canSend }"
            title="发送 (Enter)"
            @click="sendMessage"
          >
            <Send class="send-icon" />
            <span>发送</span>
          </button>
        </div>
      </div>
      <div class="footer-hint">AI 生成内容仅供参考，请结合实际教学场景进行调整</div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  AlertCircle,
  Bot,
  Check,
  FileText,
  LayoutTemplate,
  Loader2,
  MessageSquarePlus,
  MoreHorizontal,
  Paperclip,
  Send,
  User,
  X
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

import { uploadAttachmentFileAPI } from '@/api/file'
import { getMessageHistry } from '@/api/session'
import { useSessionStore } from '@/store/session'
import AiMarkdownMessage from './AiMarkdownMessage.vue'
import { normalizeMarkdownSource as normalizeMessageContent } from './markdown'

const sessionStore = useSessionStore()
const { activeSessionId, activeThreadId: threadId, activePlanId } = storeToRefs(sessionStore)

const chatBodyRef = ref(null)
const attachmentInputRef = ref(null)
const inputTextareaRef = ref(null)

const messages = ref([])
const inputText = ref('')
const pendingAttachments = ref([])
const isStreaming = ref(false)
const currentAbortController = ref(null)
const isPinnedToBottom = ref(true)
const activeSuggestions = ref([])
const activeSuggestionRunId = ref('')
const skipSuggestionsForCurrentStream = ref(false)

const AUTO_SCROLL_THRESHOLD = 48
const showSuggestions = computed(() => {
  return activeSuggestions.value.length > 0 && !!activeSuggestionRunId.value
})

const hasUploadingAttachments = computed(() =>
  pendingAttachments.value.some((file) => file.status === 'uploading')
)

const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !isStreaming.value && !hasUploadingAttachments.value
})

const createAttachmentUid = () => {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const isNearBottom = (element) => {
  if (!element) {
    return true
  }

  return element.scrollHeight - element.scrollTop - element.clientHeight <= AUTO_SCROLL_THRESHOLD
}

const handleChatScroll = () => {
  isPinnedToBottom.value = isNearBottom(chatBodyRef.value)
}

const handleAiMessageRendered = async () => {
  await scrollToBottom()
}

const createPendingAttachment = (file) => {
  return {
    uid: createAttachmentUid(),
    id: null,
    name: file.name,
    size: file.size,
    status: 'uploading',
    errorMessage: ''
  }
}

const createStreamState = (sessionId) => {
  return {
    sessionId,
    runId: '',
    progressMessageIndex: -1,
    aiMessageIndex: -1,
    hasReceivedToken: false,
    hasReceivedError: false
  }
}

const isActiveStreamState = (streamState) => {
  return !!streamState && streamState.sessionId === activeSessionId.value
}

const clearSuggestions = () => {
  activeSuggestions.value = []
  activeSuggestionRunId.value = ''
}

const normalizeSuggestions = (items = []) => {
  if (!Array.isArray(items)) {
    return []
  }

  const normalized = []
  const seen = new Set()

  items.forEach((item) => {
    const text = normalizeMessageContent(item).trim()
    if (!text) {
      return
    }

    const dedupeKey = text.toLocaleLowerCase()
    if (seen.has(dedupeKey)) {
      return
    }

    seen.add(dedupeKey)
    normalized.push(text)
  })

  return normalized.slice(0, 3)
}

const focusInput = async () => {
  await nextTick()
  inputTextareaRef.value?.focus()
}

const applySuggestion = async (suggestion) => {
  inputText.value = suggestion
  clearSuggestions()
  await focusInput()
}

const updatePendingAttachment = (uid, patch) => {
  const target = pendingAttachments.value.find((file) => file.uid === uid)
  if (!target) {
    return
  }
  Object.assign(target, patch)
}

const getSuccessfulAttachments = () => {
  return pendingAttachments.value
    .filter((file) => file.status === 'success' && file.id)
    .map((file) => ({
      uid: file.uid,
      id: file.id,
      name: file.name,
      size: file.size
    }))
}

const triggerAttachmentUpload = () => {
  if (!activePlanId.value) {
    ElMessage.warning('请先选择或新建一个左侧的教学计划')
    return
  }
  if (!threadId.value) {
    ElMessage.warning('请先选择一个会话后再上传附件')
    return
  }
  attachmentInputRef.value?.click()
}

const uploadAttachment = async (rawFile) => {
  const localAttachment = createPendingAttachment(rawFile)
  pendingAttachments.value.push(localAttachment)
  await scrollToBottom()

  try {
    const res = await uploadAttachmentFileAPI(activePlanId.value, threadId.value, rawFile)
    const attachment = res?.data || res

    updatePendingAttachment(localAttachment.uid, {
      id: attachment?.id ?? null,
      status: 'success',
      errorMessage: ''
    })
  } catch (error) {
    const errorMessage =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      '上传失败'

    updatePendingAttachment(localAttachment.uid, {
      status: 'error',
      errorMessage
    })
    ElMessage.error(`${rawFile.name} 上传失败`)
  } finally {
    await scrollToBottom()
  }
}

const handleAttachmentSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  event.target.value = ''

  if (!files.length) {
    return
  }
  if (!activePlanId.value) {
    ElMessage.warning('请先选择或新建一个左侧的教学计划')
    return
  }
  if (!threadId.value) {
    ElMessage.warning('请先选择一个会话后再上传附件')
    return
  }

  files.forEach((file) => {
    uploadAttachment(file)
  })
}

const removeAttachment = (uid) => {
  const index = pendingAttachments.value.findIndex((file) => file.uid === uid)
  if (index > -1) {
    pendingAttachments.value.splice(index, 1)
  }
}

const appendErrorMessage = async (content = '对话请求失败，请稍后重试。') => {
  messages.value.push({
    role: 'ai',
    type: 'text',
    content: normalizeMessageContent(content)
  })
  await scrollToBottom()
}

const normalizeSseText = (value = '') => {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

const splitSseBlocks = (buffer) => {
  const normalizedBuffer = normalizeSseText(buffer)
  const blocks = normalizedBuffer.split('\n\n')

  return {
    eventBlocks: blocks.slice(0, -1),
    rest: blocks.at(-1) ?? ''
  }
}

const parseSseEvent = (rawEvent) => {
  const lines = normalizeSseText(rawEvent).split('\n')
  let event = 'message'
  const dataLines = []

  for (const line of lines) {
    if (!line.trim()) continue

    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
      continue
    }

    if (line.startsWith('data:')) {
      const rawData = line.slice(5)
      dataLines.push(rawData.startsWith(' ') ? rawData.slice(1) : rawData)
    }
  }

  return {
    event,
    data: dataLines.join('\n')
  }
}

const parseJsonPayload = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const ensureProgressMessage = (streamState, runId) => {
  const current = messages.value[streamState.progressMessageIndex]
  if (current?.type === 'progress-status' && current.runId === runId) {
    return current
  }

  messages.value.push({
    role: 'ai',
    type: 'progress-status',
    runId,
    steps: [],
    isComplete: false
  })
  streamState.progressMessageIndex = messages.value.length - 1
  return messages.value[streamState.progressMessageIndex]
}

const ensureAiTextMessage = (streamState, runId = '') => {
  const current = messages.value[streamState.aiMessageIndex]
  if (current?.type === 'text' && current.role === 'ai' && current.runId === runId) {
    return current
  }

  messages.value.push({
    role: 'ai',
    type: 'text',
    runId,
    content: '',
    isPending: false
  })
  streamState.aiMessageIndex = messages.value.length - 1
  return messages.value[streamState.aiMessageIndex]
}

const shouldShowPendingAiMessage = (steps = []) => {
  return steps.length > 0 && steps.every((step) => step.status === 'success')
}

const updateProgressMessage = async (streamState, payload) => {
  if (!isActiveStreamState(streamState) || !payload?.run_id) {
    return
  }

  const message = ensureProgressMessage(streamState, payload.run_id)
  message.steps = Array.isArray(payload.steps) ? payload.steps : []
  message.isComplete =
    message.steps.length > 0 &&
    message.steps.every((step) => ['success', 'failed'].includes(step.status))

  if (!streamState.hasReceivedToken && !streamState.hasReceivedError) {
    const shouldPending = shouldShowPendingAiMessage(message.steps)
    const currentAiMessage = messages.value[streamState.aiMessageIndex]
    const hasCurrentAiMessage =
      currentAiMessage?.type === 'text' &&
      currentAiMessage.role === 'ai' &&
      currentAiMessage.runId === payload.run_id

    if (shouldPending || hasCurrentAiMessage) {
      const aiMessage = ensureAiTextMessage(streamState, payload.run_id)
      aiMessage.isPending = shouldPending
    }
  }

  await scrollToBottom()
}

const appendTokenToMessage = async (streamState, runId, text) => {
  if (!text || !isActiveStreamState(streamState)) {
    return
  }

  const aiMessage = ensureAiTextMessage(streamState, runId)
  aiMessage.isPending = false
  aiMessage.content = `${normalizeMessageContent(aiMessage.content)}${text}`
}

const markProgressFailed = async (streamState, stepKey, detail) => {
  const message = messages.value[streamState.progressMessageIndex]
  if (!message || message.type !== 'progress-status') {
    return
  }

  let targetStep = null
  if (stepKey) {
    targetStep = message.steps.find((step) => step.step_key === stepKey)
  }
  if (!targetStep) {
    targetStep = [...message.steps].reverse().find((step) => step.status === 'running')
  }

  if (targetStep) {
    targetStep.status = 'failed'
    if (detail) {
      targetStep.detail = detail
    }
  }
  message.isComplete =
    message.steps.length > 0 &&
    message.steps.every((step) => ['success', 'failed'].includes(step.status))

  await scrollToBottom()
}

const updateSuggestions = (streamState, payload) => {
  if (!isActiveStreamState(streamState) || !payload?.run_id) {
    return
  }
  if (streamState.runId && payload.run_id !== streamState.runId) {
    return
  }
  if (!streamState.hasReceivedToken || streamState.hasReceivedError) {
    return
  }
  if (skipSuggestionsForCurrentStream.value || inputText.value.trim().length > 0) {
    return
  }

  const suggestions = normalizeSuggestions(payload.suggestions)
  if (!suggestions.length) {
    return
  }

  activeSuggestionRunId.value = payload.run_id
  activeSuggestions.value = suggestions
}

const handleParsedEvent = async (event, data, streamState) => {
  if (!isActiveStreamState(streamState) && event !== 'done') {
    return false
  }

  if (event === 'metadata') {
    const payload = parseJsonPayload(data)
    if (payload?.thread_id) {
      threadId.value = payload.thread_id
    }
    if (payload?.run_id) {
      streamState.runId = payload.run_id
    }
    return false
  }

  if (event === 'progress') {
    const payload = parseJsonPayload(data)
    if (payload?.run_id) {
      streamState.runId = payload.run_id
    }
    await updateProgressMessage(streamState, payload)
    return false
  }

  if (event === 'token') {
    const payload = parseJsonPayload(data)
    const text = payload?.text || ''
    if (text) {
      streamState.hasReceivedToken = true
      await appendTokenToMessage(streamState, payload?.run_id || streamState.runId, text)
    }
    return false
  }
  if (event === 'suggestions') {
    const payload = parseJsonPayload(data)
    updateSuggestions(streamState, payload)
    return false
  }
/* 
  if (event === 'message') {
    if (streamState.hasReceivedToken) {
      return false
    }
    if (data) {
      await appendTokenToMessage(streamState, streamState.runId, data)
    }
    return false
  }
*/
  if (event === 'error') {
    const payload = parseJsonPayload(data)
    streamState.hasReceivedError = true
    await markProgressFailed(streamState, payload?.step_key, payload?.message)
    await appendErrorMessage(payload?.message || '对话请求失败，请稍后重试。')
    return false
  }

  if (event === 'done' || data === '[DONE]') {
    const progressMessage = messages.value[streamState.progressMessageIndex]
    if (progressMessage?.type === 'progress-status') {
      progressMessage.isComplete =
        progressMessage.steps.length > 0 &&
        progressMessage.steps.every((step) => ['success', 'failed'].includes(step.status))
    }
    return true
  }

  return false
}

const handleStreamResponse = async (response, streamState) => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  if (!response.body) {
    throw new Error('Empty response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

    const { eventBlocks, rest } = splitSseBlocks(buffer)
    buffer = rest

    for (const block of eventBlocks) {
      if (!block.trim()) continue

      const { event, data } = parseSseEvent(block)
      const shouldStop = await handleParsedEvent(event, data, streamState)
      if (shouldStop) {
        return
      }
    }

    if (done) {
      if (buffer.trim()) {
        const { event, data } = parseSseEvent(buffer)
        await handleParsedEvent(event, data, streamState)
      }
      return
    }
  }
}

const requestStreamReply = async (content, attachmentIds = []) => {
  isStreaming.value = true
  currentAbortController.value = new AbortController()
  skipSuggestionsForCurrentStream.value = false
  const streamState = createStreamState(activeSessionId.value)

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: content,
        thread_id: threadId.value || undefined,
        attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined
      }),
      signal: currentAbortController.value.signal
    })

    await handleStreamResponse(response, streamState)
  } catch (error) {
    if (error?.name !== 'AbortError' && !streamState.hasReceivedError && isActiveStreamState(streamState)) {
      console.error('Streaming chat failed:', error)
      await appendErrorMessage()
    }
  } finally {
    isStreaming.value = false
    currentAbortController.value = null
    await scrollToBottom()
  }
}

const sendMessage = async () => {
  if (!canSend.value) return

  const content = inputText.value.trim()
  const successfulAttachments = getSuccessfulAttachments()
  const attachmentIds = successfulAttachments.map((file) => file.id)

  clearSuggestions()

  messages.value.push({
    role: 'teacher',
    type: 'text',
    content: normalizeMessageContent(content),
    attachments: successfulAttachments.length > 0 ? successfulAttachments : undefined
  })

  inputText.value = ''
  pendingAttachments.value = []

  await scrollToBottom(true)
  await requestStreamReply(content, attachmentIds)
}

const scrollToBottom = async (force = false) => {
  await nextTick()
  if (!chatBodyRef.value) {
    return
  }

  if (!force && !isPinnedToBottom.value) {
    return
  }

  chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  isPinnedToBottom.value = true
}

const normalizeMessageList = (items = []) => {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((message) => ({
    ...message,
    content: normalizeMessageContent(message?.content)
  }))
}

const loadHistory = async () => {
  pendingAttachments.value = []
  clearSuggestions()
  skipSuggestionsForCurrentStream.value = false

  if (!activeSessionId.value) {
    messages.value = []
    return
  }

  const targetId = threadId.value || activeSessionId.value
  if (!targetId) {
    messages.value = []
    return
  }

  try {
    const res = await getMessageHistry(targetId)
    if (res.data && res.data.messages) {
      messages.value = normalizeMessageList(res.data.messages)
    } else {
      messages.value = []
    }
    await scrollToBottom(true)
  } catch (error) {
    console.error('获取历史消息失败', error)
    messages.value = []
  }
}

watch(
  () => inputText.value,
  (value) => {
    if (value.trim().length > 0) {
      clearSuggestions()
      if (isStreaming.value) {
        skipSuggestionsForCurrentStream.value = true
      }
    }
  }
)

watch(
  () => activeSessionId.value,
  () => {
    currentAbortController.value?.abort()
    clearSuggestions()
    skipSuggestionsForCurrentStream.value = false
    loadHistory()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  currentAbortController.value?.abort()
  clearSuggestions()
})
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
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
  color: #ffffff;
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
}

.message-text-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-bubble.is-pending {
  min-width: 54px;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
}

.message-left .message-bubble {
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  border-top-left-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.message-right .message-bubble {
  background-color: var(--primary-color);
  color: #ffffff;
  border-top-right-radius: 2px;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

.message-waiting-dots {
  color: var(--text-disabled);
}

.progress-status-card {
  width: 340px;
  max-width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.progress-status-card.is-complete {
  background: #ffffff;
}

.progress-status-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.progress-status-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.progress-step-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-disabled);
}

.progress-step-item.is-success {
  color: var(--text-secondary);
}

.progress-step-item.is-failed {
  color: #dc2626;
}

.progress-step-indicator {
  width: 18px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #cbd5e1;
}

.step-icon {
  width: 15px;
  height: 15px;
}

.step-icon.success {
  color: #10b981;
}

.step-icon.failed {
  color: #ef4444;
}

.waiting-dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.waiting-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.35;
  animation: waiting-dot-bounce 1.2s infinite ease-in-out;
}

.waiting-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.waiting-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.progress-step-body {
  min-width: 0;
}

.progress-step-label {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.progress-step-detail {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.45;
  color: inherit;
  opacity: 0.86;
}

.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.chat-footer {
  position: relative;
  padding: 20px 24px;
  background-color: var(--bg-main);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.02);
  z-index: 10;
}

.suggestion-layer {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: calc(100% + 14px);
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  pointer-events: none;
  z-index: 30;
}

.suggestion-card {
  pointer-events: auto;
  display: inline-flex;
  flex-direction: column;
  gap: 10px;
  max-width: min(720px, calc(100vw - 80px));
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.558);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(8px);
}

.suggestion-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.suggestion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.suggestion-chip {
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #ffffff;
  color: var(--text-secondary);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.suggestion-chip:hover {
  transform: translateY(-1px);
  color: var(--text-main);
  border-color: rgba(79, 70, 229, 0.22);
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.08);
}

.suggestion-chip:active {
  transform: translateY(0);
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

.attachment-card.is-uploading {
  border-color: #c7d2fe;
  background-color: #f8faff;
}

.attachment-card.is-error {
  border-color: #fecaca;
  background-color: #fef2f2;
}

.attachment-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.attachment-status-text {
  color: #ef4444;
  font-size: 11px;
  line-height: 1.3;
  margin-top: 2px;
}

.sent-attachment {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-main);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
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

.file-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  color: var(--text-secondary);
  flex-shrink: 0;
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

.suggestion-fade-enter-active,
.suggestion-fade-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.suggestion-fade-enter-from,
.suggestion-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.send-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.send-btn {
  background-color: var(--primary-color);
  color: #ffffff;
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

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes waiting-dot-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.3;
  }

  40% {
    transform: translateY(-2px);
    opacity: 1;
  }
}
</style>
