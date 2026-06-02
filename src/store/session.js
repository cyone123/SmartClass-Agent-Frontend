import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const activeSessionId = ref('')
  const activeThreadId = ref('')
  const activePlanId = ref('')
  
  const setActiveSession = (id, threadId = '', planId = '') => {
    activeSessionId.value = id
    activeThreadId.value = threadId
    if (planId) {
      activePlanId.value = planId
    }
  }

  const resetActiveSession = () => {
    activeSessionId.value = ''
    activeThreadId.value = ''
    activePlanId.value = ''
  }
  
  return {
    activeSessionId,
    activeThreadId,
    activePlanId,
    resetActiveSession,
    setActiveSession
  }
})
