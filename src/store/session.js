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
  
  return {
    activeSessionId,
    activeThreadId,
    activePlanId,
    setActiveSession
  }
})
