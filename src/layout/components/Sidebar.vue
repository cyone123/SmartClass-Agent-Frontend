<template>
  <div class="sidebar">
    <div class="logo-area">
      <div class="logo-icon-wrapper">
        <MonitorPlay class="logo-icon" />
      </div>
      <span class="logo-text">智课伴侣</span>
    </div>

    <div class="plan-actions">
      <button class="new-plan-btn" @click="handleNewPlan">
        <Plus class="btn-icon" />
        新建教学计划
      </button>
    </div>

    <div class="menu-container">
      <div v-for="plan in plans" :key="plan.id" class="plan-group">
        <div class="plan-header" @click="togglePlan(plan.id)">
          <ChevronRight class="toggle-icon" :class="{ 'is-open': openPlans.includes(plan.id) }" />
          <FolderClosed class="plan-icon" v-if="!openPlans.includes(plan.id)" />
          <FolderOpen class="plan-icon" v-else />
          <input 
            v-if="plan.isEditing"
            v-model="plan.tempName"
            v-focus
            @click.stop
            @blur="saveNewPlan(plan)"
            @keyup.enter="saveNewPlan(plan)"
            class="edit-input"
          />
          <template v-else>
            <span class="plan-name" :title="plan.name">{{ plan.name }}</span>
            <div class="item-actions">
              <button class="action-btn" @click.stop="startEditPlan(plan)" title="重命名">
                <Pencil class="action-icon" />
              </button>
              <button class="action-btn delete-btn" @click.stop="removePlan(plan)" title="删除">
                <Trash2 class="action-icon" />
              </button>
            </div>
          </template>
        </div>
        
        <div class="session-list" v-show="openPlans.includes(plan.id)">
          <div 
            v-for="session in plan.sessions" 
            :key="session.id" 
            class="session-item"
            :class="{ 'is-active': activeSessionId === session.id.toString() }"
            @click="handleSelectSession(session.id.toString(), plan.id)"
          >
            <MessageSquare class="session-icon" />
            <input
              v-if="session.isEditing"
              v-model="session.tempName"
              v-focus
              @click.stop
              @blur="saveNewSession(plan, session)"
              @keyup.enter="saveNewSession(plan, session)"
              class="edit-input"
            />
            <template v-else>
              <span class="session-name">{{ session.name }}</span>
              <div class="item-actions">
                <button class="action-btn" @click.stop="startEditSession(session)" title="重命名">
                  <Pencil class="action-icon" />
                </button>
                <button class="action-btn delete-btn" @click.stop="removeSession(plan, session)" title="删除">
                  <Trash2 class="action-icon" />
                </button>
              </div>
            </template>
          </div>
          
          <div class="session-item new-session-item" @click="handleSelectSession('new_session_' + plan.id, plan.id)">
            <PlusCircle class="session-icon" />
            <span>新建会话</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { MonitorPlay, Plus, FolderClosed, FolderOpen, ChevronRight, MessageSquare, PlusCircle, Palmtree, Pencil, Trash2 } from 'lucide-vue-next'
import { getPlanAndSessionListAPI, addPlanAPI, updateSessionAPI, deleteSessionAPI, addSessionAPI, updatePlanAPI, deletePlanAPI } from '@/api/session'
import { useSessionStore } from '@/store/session'
import { storeToRefs } from 'pinia'

const vFocus = {
  mounted: (el) => {
    el.focus()
    el.select()
  }
}

const plans = ref([])

const sessionStore = useSessionStore()
const { activeSessionId } = storeToRefs(sessionStore)
const openPlans = ref([1])

onMounted(() => {
  getPlanAndSessionList()
})

const togglePlan = (id) => {
  const index = openPlans.value.indexOf(id)
  if (index > -1) {
    openPlans.value.splice(index, 1)
  } else {
    openPlans.value.push(id)
  }
}

const startEditPlan = (plan) => {
  plan.tempName = plan.name
  plan.isEditing = true
}

const startEditSession = (session) => {
  session.tempName = session.name
  session.isEditing = true
}

const removePlan = async (plan) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该教学计划吗？同时会删除其所有会话内容。',
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await deletePlanAPI(plan.id)
    const index = plans.value.findIndex(p => p.id === plan.id)
    if (index > -1) plans.value.splice(index, 1)
    ElMessage.success('删除成功')
  } catch (err) {
    if (err !== 'cancel') console.error('删除计划失败', err)
  }
}

const removeSession = async (plan, session) => {
  try {
    console.log('点击删除按钮')
    await ElMessageBox.confirm(
      '确定要删除该会话吗？',
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    console.log('发起删除请求')
    await deleteSessionAPI(session.id)
    const index = plan.sessions.findIndex(s => s.id === session.id)
    if (index > -1) plan.sessions.splice(index, 1)
    
    // Switch active session if current is deleted
    if (activeSessionId.value === session.id.toString()) {
      sessionStore.setActiveSession('', '', plan.id)
    }
    ElMessage.success('删除成功')
  } catch (err) {
    if (err !== 'cancel') console.error('删除会话失败', err)
  }
}

const handleNewPlan = () => {
  const newPlan = {
    id: 'temp_plan_' + Date.now(),
    name: "新计划",
    tempName: "新计划",
    sessions: [],
    isEditing: true
  }
  plans.value.unshift(newPlan)
  if (!openPlans.value.includes(newPlan.id)) {
    openPlans.value.push(newPlan.id)
  }
}

const saveNewPlan = async (plan) => {
  if (!plan.isEditing) return
  plan.isEditing = false
  const newName = plan.tempName?.trim() || plan.name
  if (!newName) return
  
  const isNew = typeof plan.id === 'string' && plan.id.startsWith('temp_')
  plan.name = newName
  
  if (isNew) {
    const oldId = plan.id
    try {
      const res = await addPlanAPI({ name: plan.name })
      if (res.data?.id) plan.id = res.data.id
      
      const openIndex = openPlans.value.indexOf(oldId)
      if (openIndex > -1) openPlans.value[openIndex] = plan.id
    } catch (error) { console.error('新建教学计划失败', error) }
  } else {
    try {
      await updatePlanAPI({ id: plan.id, name: plan.name })
      ElMessage.success('重命名成功')
    } catch (error) { console.error('重命名计划失败', error) }
  }
}

const handleSelectSession = (index, planId) => {
  if (index?.startsWith('new_session_')) {
    handleNewSession(planId)
    return
  }
  
  let targetThreadId = ''
  for (const plan of plans.value) {
    if (!plan.sessions) continue
    const session = plan.sessions.find(s => s.id.toString() === index.toString())
    if (session) {
      targetThreadId = session.thread_id || ''
      break
    }
  }
  
  sessionStore.setActiveSession(index, targetThreadId, planId)
}

const handleNewSession = (planId) => {
  const plan = plans.value.find(p => p.id === planId)
  if (!plan) return
  
  const newSession = {
    id: 'temp_session_' + Date.now(),
    name: "新会话",
    tempName: "新会话",
    isEditing: true
  }
  
  if (!plan.sessions) {
    plan.sessions = []
  }
  plan.sessions.unshift(newSession)
}

const saveNewSession = async (plan, session) => {
  if (!session.isEditing) return
  session.isEditing = false
  const newName = session.tempName?.trim() || session.name
  if (!newName) return
  
  const isNew = typeof session.id === 'string' && session.id.startsWith('temp_')
  session.name = newName
  
  if (isNew) {
    try {
      const res = await addSessionAPI({ plan_id: plan.id, name: session.name })
      if (res.data?.id) session.id = res.data.id
      if (res.data?.thread_id) session.thread_id = res.data.thread_id
      sessionStore.setActiveSession(session.id.toString(), session.thread_id || '', plan.id)
    } catch (error) { console.error('新建会话失败', error) }
  } else {
    try {
      await updateSessionAPI(session)
      ElMessage.success('重命名成功')
    } catch (error) { console.error('重命名会话失败', error) }
  }
}

const getPlanAndSessionList = async () => {
  try {
    const res = await getPlanAndSessionListAPI()
    console.log('获取教学计划和会话列表', res)
    if (res.data) {
      plans.value = res.data
      
      if (!activeSessionId.value && res.data.length > 0 && res.data[0].sessions?.length > 0) {
        // If no active session, optionally select the first one
        const firstSession = res.data[0].sessions[0]
        sessionStore.setActiveSession(firstSession.id.toString(), firstSession.thread_id || '', res.data[0].id)
        openPlans.value.push(res.data[0].id)
      } else if (activeSessionId.value) {
        // Sync thread_id for initially hardcoded active session
        let targetThreadId = ''
        let targetPlanId = ''
        for (const plan of plans.value) {
          if (!plan.sessions) continue
          const session = plan.sessions.find(s => s.id.toString() === activeSessionId.value.toString())
          if (session) {
            targetThreadId = session.thread_id || ''
            targetPlanId = plan.id
            break
          }
        }
        sessionStore.setActiveSession(activeSessionId.value, targetThreadId, targetPlanId)
      }
    }
  } catch (error) {
    console.error('获取教学计划和会话列表失败', error)
  }
}


</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo-area {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  border-bottom: 1px solid var(--border-color);
}
.logo-icon-wrapper {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  border-radius: 8px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  box-shadow: var(--shadow-sm);
}
.logo-icon {
  width: 18px;
  height: 18px;
  color: white;
}

.plan-actions {
  padding: 16px 20px;
}
.new-plan-btn {
  width: 100%;
  border-radius: var(--border-radius);
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 0;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}
.new-plan-btn:hover {
  background-color: var(--primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.menu-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
}

.plan-group {
  margin-bottom: 4px;
}

.plan-header {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 8px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-main);
  font-weight: 500;
  font-size: 13px;
  transition: background-color 0.15s ease;
}
.plan-header:hover {
  background-color: #e2e8f080;
}
.toggle-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  color: var(--text-disabled);
  transition: transform 0.2s ease;
}
.toggle-icon.is-open {
  transform: rotate(90deg);
}
.plan-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  color: var(--text-secondary);
}
.plan-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-input {
  flex: 1;
  width: 100%;
  height: 24px;
  background-color: var(--bg-main, #fff);
  border: 1px solid var(--primary-color, #3b82f6);
  border-radius: 4px;
  padding: 0 6px;
  font-size: 13px;
  color: var(--text-main);
  outline: none;
  font-family: inherit;
}
.edit-input:focus {
  border-color: var(--primary-hover, #2563eb);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.session-list {
  padding-left: 22px;
  margin-top: 2px;
  margin-bottom: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 10px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 2px;
  transition: all 0.15s ease;
}
.session-icon {
  width: 14px;
  height: 14px;
  margin-right: 8px;
  opacity: 0.7;
}

.session-item:hover {
  background-color: #e2e8f080;
  color: var(--text-main);
}
.session-item.is-active {
  background-color: #e0e7ff; /* light indigo */
  color: var(--primary-hover);
  font-weight: 500;
}
.session-item.is-active .session-icon {
  opacity: 1;
  color: var(--primary-color);
}

.item-actions {
  display: flex;
  opacity: 0;
  transition: opacity 0.2s ease;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}
.plan-header:hover .item-actions,
.session-item:hover .item-actions {
  opacity: 1;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: var(--text-secondary, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.action-btn:hover {
  background-color: #e2e8f0;
  color: var(--primary-color, #3b82f6);
}
.action-btn.delete-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}
.action-icon {
  width: 14px;
  height: 14px;
}

.new-session-item {
  color: var(--text-disabled);
}
.new-session-item:hover {
  color: var(--primary-color);
  background-color: transparent;
}
.new-session-item .session-icon {
  opacity: 1;
}
</style>
