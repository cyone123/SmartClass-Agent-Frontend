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
          <span class="plan-name" :title="plan.name">{{ plan.name }}</span>
        </div>
        
        <div class="session-list" v-show="openPlans.includes(plan.id)">
          <div 
            v-for="session in plan.sessions" 
            :key="session.id" 
            class="session-item"
            :class="{ 'is-active': activeSessionId === session.id.toString() }"
            @click="handleSelectSession(session.id.toString())"
          >
            <MessageSquare class="session-icon" />
            <span class="session-name">{{ session.name }}</span>
          </div>
          
          <div class="session-item new-session-item" @click="handleSelectSession('new_session_' + plan.id)">
            <PlusCircle class="session-icon" />
            <span>新建会话</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MonitorPlay, Plus, FolderClosed, FolderOpen, ChevronRight, MessageSquare, PlusCircle } from 'lucide-vue-next'

const plans = ref([
  { 
    id: 1, 
    name: '高一数学 - 函数的引入',
    sessions: [
      { id: 101, name: '初稿思路' }, 
      { id: 102, name: '修改课件' }
    ]
  },
  {
    id: 2,
    name: '高二物理 - 牛顿定律',
    sessions: [
      { id: 201, name: '课堂引入设计' }
    ]
  }
])

const activeSessionId = ref('101')
const openPlans = ref([1])

const togglePlan = (id) => {
  const index = openPlans.value.indexOf(id)
  if (index > -1) {
    openPlans.value.splice(index, 1)
  } else {
    openPlans.value.push(id)
  }
}

const handleNewPlan = () => {
  console.log('新建教学计划')
}

const handleSelectSession = (index) => {
  if (index.startsWith('new_session_')) {
    console.log('新建会话', index)
    return
  }
  activeSessionId.value = index
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
