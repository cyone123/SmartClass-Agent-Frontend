<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="preview-overlay" @click.self="handleClose">
        <div class="preview-modal">
          <div class="modal-header">
            <h3>课件与资料预览</h3>
            <div class="header-actions">
              <!-- <button class="save-btn" @click="handleSaveClick" :disabled="isSaving" v-if="currentFileKey">
                <Loader2 class="icon spin" v-if="isSaving" />
                <Save class="icon" v-else />
                <span>{{ isSaving ? '强制保存中...' : '保存修改' }}</span>
              </button> -->
              <button class="close-btn" @click="handleClose">
                <X class="icon" />
              </button>
            </div>
          </div>
          <div class="modal-body">
            <div id="onlyoffice-editor" class="editor-container"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, watch, nextTick, ref } from 'vue'
import { getConfigAPI, forceSaveAPI } from "@/api/file"
import { X, Save, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  fileId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:visible'])

let docEditor = null
const currentFileKey = ref(null)
const isSaving = ref(false)

const initEditor = async () => {
  if (docEditor) {
    docEditor.destroyEditor()
    docEditor = null
  }
  if (!props.fileId) return
  
  try {
    const config = await getConfigAPI(props.fileId)
    // // ONLYOFFICE 的标准初始化配置中，key 通常位于 config.document.key
    // // 但为兼容可能被后端扁平化包裹的情况，我们做了兼容读取：
    // currentFileKey.value = config.document?.key || config.key 
    
    await nextTick()
    if (document.getElementById('onlyoffice-editor') && window.DocsAPI) {
      docEditor = new window.DocsAPI.DocEditor('onlyoffice-editor', config)
    }
  } catch (error) {
    console.error('Failed to initialize ONLYOFFICE editor:', error)
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden' // 防止背景滚动
    initEditor()
  } else {
    document.body.style.overflow = ''
    if (docEditor) {
      docEditor.destroyEditor()
      docEditor = null
    }
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

// const handleSave = async (key) => {
//     const res = await forceSaveAPI(key)
//     console.log("强制保存的响应：", res.data)
// }

// const handleSaveClick = async () => {
//   if (!currentFileKey.value) return
//   isSaving.value = true
//   try {
//     await handleSave(currentFileKey.value)
//   } catch (error) {
//     console.error('Save failed:', error)
//   } finally {
//     setTimeout(() => {
//       isSaving.value = false
//     }, 500) // 增加微小延迟让动效显得更饱满
//   }
// }

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  if (docEditor) {
    docEditor.destroyEditor()
    docEditor = null
  }
})
</script>

<style scoped>
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-modal {
  width: 90vw;
  height: 90vh;
  max-width: 1400px;
  max-height: 900px;
  background-color: #ffffff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: #f8fafc;
}

.modal-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);
}

.save-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
}

.save-btn .icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #e2e8f0;
  color: #ef4444;
}

.icon {
  width: 18px;
  height: 18px;
}

.modal-body {
  flex: 1;
  width: 100%;
  position: relative;
  background-color: #f1f5f9;
}

.editor-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .preview-modal {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transform: scale(0.98) translateY(10px);
}

.fade-enter-to .preview-modal {
  transform: scale(1) translateY(0);
}

.fade-leave-active .preview-modal {
  transition: transform 0.3s ease;
}

.fade-leave-to .preview-modal {
  transform: scale(0.98) translateY(10px);
}
</style>