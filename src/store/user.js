import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const activeAccountId = ref('teacher-1')

  const setActiveAccount = (accountId) => {
    activeAccountId.value = accountId || 'default-teacher'
  }

  return {
    activeAccountId,
    setActiveAccount
  }
})
