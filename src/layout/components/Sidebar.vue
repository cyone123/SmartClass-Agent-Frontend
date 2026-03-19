<template>
  <div class="sidebar">
    <div class="logo-area">
      <el-icon class="logo-icon"><Platform /></el-icon>
      <span class="logo-text">智课伴侣</span>
    </div>

    <div class="plan-actions">
      <el-button type="primary" class="new-plan-btn" @click="handleNewPlan">
        <el-icon><Plus /></el-icon>
        新建教学计划
      </el-button>
    </div>

    <div class="menu-container">
      <el-menu
        :default-active="activeSessionId"
        class="plan-menu"
        :default-openeds="[plans[0]?.id.toString()]"
        @select="handleSelectSession"
      >
        <el-sub-menu v-for="plan in plans" :key="plan.id" :index="plan.id.toString()">
          <template #title>
            <el-icon><Folder /></el-icon>
            <span class="plan-name" :title="plan.name">{{ plan.name }}</span>
          </template>
          
          <el-menu-item 
            v-for="session in plan.sessions" 
            :key="session.id" 
            :index="session.id.toString()"
          >
            <el-icon><ChatDotRound /></el-icon>
            <span class="session-name">{{ session.name }}</span>
          </el-menu-item>

          <el-menu-item :index="'new_session_' + plan.id" class="new-session-item">
            <el-icon><DocumentAdd /></el-icon>
            <span>新建会话</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
  border-bottom: 1px solid var(--border-color);
}
.logo-icon {
  margin-right: 8px;
  font-size: 24px;
}

.plan-actions {
  padding: 16px 20px;
}
.new-plan-btn {
  width: 100%;
  border-radius: 8px;
}

.menu-container {
  flex: 1;
  overflow-y: auto;
}

/* 覆盖 el-menu 的默认样式，使其更符合 SaaS 风格 */
.plan-menu {
  border-right: none;
  background-color: transparent;
}
:deep(.el-sub-menu__title) {
  font-weight: 500;
  height: 44px;
  line-height: 44px;
}
:deep(.el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin: 4px 12px;
  border-radius: 6px;
  color: var(--text-secondary);
}
:deep(.el-menu-item.is-active) {
  background-color: #e6f0ff;
  color: var(--primary-color);
  font-weight: 500;
}
.new-session-item {
  color: var(--primary-color) !important;
  opacity: 0.8;
}
.new-session-item:hover {
  opacity: 1;
  background-color: transparent !important;
}

.plan-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
