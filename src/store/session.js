import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const activeSessionId = ref('')
  const activeThreadId = ref('')
  
  const setActiveSession = (id, threadId = '') => {
    activeSessionId.value = id
    activeThreadId.value = threadId
  }
  
  return {
    activeSessionId,
    activeThreadId,
    setActiveSession
  }
})
