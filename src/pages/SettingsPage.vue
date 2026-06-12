<template>
  <div class="settings-page">
    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 团购套餐管理 -->
      <el-tab-pane label="🍱 团购套餐管理" name="packages">
        <div class="tab-content">
          <div class="action-bar">
            <el-button type="primary" @click="showAddPackageDialog">
              <el-icon><Plus /></el-icon> 新增套餐
            </el-button>
          </div>
          <el-table 
            ref="packageTableRef"
            :data="packages" 
            stripe 
            border 
            style="width: 100%"
            row-key="id"
          >
            <el-table-column width="50" align="center">
              <template #default>
                <el-icon class="drag-handle" style="cursor: move;">
                  <Rank />
                </el-icon>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="套餐名称" min-width="150" />
            <el-table-column prop="entertainment" label="适用类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getEntertainmentType(row.entertainment)">
                  {{ row.entertainment }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="100" align="right">
              <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="duration" label="时长(分钟)" width="120" align="center">
              <template #default="{ row }">{{ row.duration || '-' }}</template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="editPackage(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deletePackage(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 备份管理 -->
      <el-tab-pane label="💾 备份管理" name="backup">
        <div class="tab-content backup-content">
          <!-- 备份设置 -->
          <el-card shadow="never" class="backup-card">
            <template #header><span style="font-weight:600">备份设置</span></template>
            <el-form label-width="140px" size="default">
              <el-form-item label="启用自动监测">
                <el-switch v-model="backupConfig.autoMonitorEnabled" @change="saveBackupConfig" />
                <span class="form-tip" style="margin-left:8px">自动检测U盘插入</span>
              </el-form-item>
              <el-form-item label="U盘自动备份" v-if="backupConfig.autoMonitorEnabled">
                <el-switch v-model="backupConfig.usbBackupEnabled" @change="saveBackupConfig" />
                <span class="form-tip" style="margin-left:8px">检测到U盘时自动备份数据</span>
              </el-form-item>
              <el-form-item label="启用定时备份">
                <el-switch v-model="backupConfig.scheduleEnabled" @change="saveBackupConfig" />
              </el-form-item>
              <el-form-item v-if="backupConfig.scheduleEnabled" label="备份时间">
                <el-time-picker
                  v-model="backupConfig.scheduleTime"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="选择备份时间"
                  @change="saveBackupConfig"
                />
                <span class="form-tip" style="margin-left:8px">每天定时执行本地备份</span>
              </el-form-item>
              <el-form-item label="保留备份数">
                <el-input-number
                  v-model="backupConfig.maxBackupCount"
                  :min="5"
                  :max="100"
                  @change="saveBackupConfig"
                />
                <span class="form-tip" style="margin-left:8px">U盘上保留最近N个备份</span>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- U盘状态 -->
          <el-card shadow="never" class="backup-card">
            <template #header>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span style="font-weight:600">U盘状态</span>
                <el-button size="small" @click="refreshUsbDrives" :loading="usbLoading">
                  <el-icon><Refresh /></el-icon> 刷新
                </el-button>
              </div>
            </template>
            <el-empty v-if="usbDrives.length === 0" description="未检测到 U 盘" :image-size="60" />
            <el-table v-else :data="usbDrives" size="small" stripe>
              <el-table-column prop="DeviceID" label="盘符" width="80" />
              <el-table-column prop="VolumeName" label="卷标" min-width="120">
                <template #default="{ row }">{{ row.VolumeName || '(未命名)' }}</template>
              </el-table-column>
              <el-table-column prop="SizeGB" label="总容量" width="110" align="right">
                <template #default="{ row }">{{ row.SizeGB }} GB</template>
              </el-table-column>
              <el-table-column prop="FreeGB" label="可用空间" width="110" align="right">
                <template #default="{ row }">{{ row.FreeGB }} GB</template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default>
                  <el-tag type="success" size="small">已连接</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 手动操作 -->
          <el-card shadow="never" class="backup-card">
            <template #header><span style="font-weight:600">手动备份</span></template>
            <div style="display:flex;gap:12px;align-items:center">
              <el-button type="primary" @click="manualBackup('local')" :loading="backupLoading === 'local'">
                备份到本地
              </el-button>
              <el-button
                type="success"
                @click="manualBackup('usb')"
                :disabled="usbDrives.length === 0"
                :loading="backupLoading === 'usb'"
              >
                备份到U盘
              </el-button>
              <span v-if="backupConfig.lastBackupTime" style="color:#909399;font-size:12px">
                上次备份: {{ backupConfig.lastBackupTime }}
                <el-tag
                  v-if="backupConfig.lastBackupStatus"
                  :type="backupConfig.lastBackupStatus === 'success' ? 'success' : 'danger'"
                  size="small"
                  style="margin-left:6px"
                >
                  {{ backupConfig.lastBackupStatus === 'success' ? '成功' : '失败' }}
                </el-tag>
              </span>
            </div>
          </el-card>

          <!-- 备份历史 -->
          <el-card shadow="never" class="backup-card">
            <template #header>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span style="font-weight:600">备份历史</span>
                <el-button size="small" @click="loadBackupHistory">刷新</el-button>
              </div>
            </template>
            <el-table :data="backupHistory.list" size="small" stripe>
              <el-table-column prop="time" label="时间" width="170" />
              <el-table-column prop="type" label="类型" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.type === 'usb' ? 'success' : 'info'" size="small">
                    {{ row.type === 'usb' ? 'U盘' : '本地' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="目标" min-width="150">
                <template #default="{ row }">
                  {{ row.drive ? `${row.drive} (${row.driveLabel || ''})` : row.path }}
                </template>
              </el-table-column>
              <el-table-column prop="fileCount" label="文件数" width="80" align="center" />
              <el-table-column label="大小" width="100" align="right">
                <template #default="{ row }">{{ formatFileSize(row.totalSize) }}</template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                    {{ row.status === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="error" label="错误信息" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">{{ row.error || '-' }}</template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-if="backupHistory.total > 0"
              style="margin-top:12px;justify-content:flex-end"
              layout="total, prev, pager, next"
              :total="backupHistory.total"
              :page-size="backupHistory.pageSize"
              :current-page="backupHistory.page"
              @current-change="loadBackupHistory"
              small
            />
          </el-card>

          <!-- 数据还原 -->
          <el-card shadow="never" class="backup-card">
            <template #header>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span style="font-weight:600">数据还原</span>
                <el-button size="small" @click="loadRestorePoints" :loading="restoreLoading">刷新</el-button>
              </div>
            </template>
            <el-empty v-if="restorePoints.length === 0" description="暂无可还原的备份" :image-size="60" />
            <el-table v-else :data="restorePoints" size="small" stripe>
              <el-table-column prop="timestamp" label="备份时间" width="170" />
              <el-table-column label="类型" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.type === 'usb' ? 'success' : 'info'" size="small">
                    {{ row.type === 'usb' ? 'U盘' : '本地' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="来源" min-width="120">
                <template #default="{ row }">{{ row.drive || row.path }}</template>
              </el-table-column>
              <el-table-column prop="fileCount" label="文件数" width="80" align="center" />
              <el-table-column label="大小" width="100" align="right">
                <template #default="{ row }">{{ formatFileSize(row.totalSize) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="180" align="center">
                <template #default="{ row }">
                  <el-button size="small" @click="openPreviewDialog(row.path)">预览</el-button>
                  <el-button
                    size="small"
                    type="warning"
                    :disabled="!!restoringPath"
                    @click="handleRestore(row.path, row.timestamp)"
                  >
                    {{ restoringPath === row.path ? '还原中...' : '还原' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 系统主题设置 -->
      <el-tab-pane label="🎨 系统主题设置" name="theme">
        <div class="tab-content theme-content">
          <el-form label-width="120px">
            <el-form-item label="主色调">
              <el-color-picker v-model="themeConfig.primaryColor" />
            </el-form-item>
            <el-form-item label="背景风格">
              <el-radio-group v-model="themeConfig.backgroundStyle">
                <el-radio label="light">简约白</el-radio>
                <el-radio label="dark">深邃黑</el-radio>
                <el-radio label="gradient">渐变紫</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveTheme">保存主题设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 套餐编辑/新增对话框 -->
    <el-dialog v-model="showPackageDialog" :title="isEdit ? '编辑套餐' : '新增套餐'" width="500px" append-to-body>
      <el-form :model="packageForm" :rules="packageRules" ref="packageFormRef" label-width="100px">
        <el-form-item label="套餐ID">
          <el-input
            v-if="isEdit"
            v-model="packageForm.id"
            disabled
          />
          <el-input
            v-else
            value="自动生成"
            disabled
          />
        </el-form-item>
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="packageForm.name" placeholder="请输入套餐名称" />
        </el-form-item>
        <el-form-item label="适用类型" prop="entertainment">
          <el-select v-model="packageForm.entertainment" placeholder="请选择适用类型" style="width: 100%">
            <el-option label="桌游" value="桌游" />
            <el-option label="PS5" value="PS5" />
            <el-option label="拼豆" value="拼豆" />
            <el-option label="通用" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="packageForm.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时长(分)" prop="duration">
          <el-input-number v-model="packageForm.duration" :min="0" :step="30" style="width: 100%" />
          <span class="form-tip">填0表示不限时或仅含商品</span>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="packageForm.description" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPackageDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPackageForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 备份预览对话框 -->
    <el-dialog v-model="showPreviewDialog" title="备份文件预览" width="500px" append-to-body>
      <el-table :data="previewFiles" size="small" stripe>
        <el-table-column prop="name" label="文件名" min-width="200" />
        <el-table-column label="大小" width="120" align="right">
          <template #default="{ row }">{{ formatFileSize(row.size) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Rank, Refresh } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import { themeConfig, saveTheme, applyTheme } from '../composables/useTheme'

const activeTab = ref('packages')
const packages = ref<any[]>([])
const showPackageDialog = ref(false)
const isEdit = ref(false)
const packageFormRef = ref<FormInstance>()
const packageTableRef = ref()

const packageForm = reactive({
  id: '',
  name: '',
  entertainment: '桌游',
  price: 0,
  duration: 120,
  description: ''
})

const packageRules: FormRules = {
  id: [{ required: true, message: '请输入套餐ID', trigger: 'blur' }],
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  entertainment: [{ required: true, message: '请选择适用类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

// themeConfig, saveTheme, applyTheme imported from composable

// 加载套餐
const loadPackages = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/packages')
    const result = await res.json()
    if (result.success) {
      packages.value = result.data
      // 数据加载完成后初始化拖拽
      await nextTick()
      initSortable()
    }
  } catch (error) {
    ElMessage.error('加载套餐失败')
  }
}

// 初始化拖拽排序
const initSortable = () => {
  if (!packageTableRef.value) return
  
  const tbody = packageTableRef.value.$el.querySelector('.el-table__body-wrapper tbody')
  if (!tbody) return
  
  Sortable.create(tbody, {
    handle: '.drag-handle',
    animation: 150,
    onEnd: async (evt: any) => {
      const { oldIndex, newIndex } = evt
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
      
      // 交换数组中的元素
      const movedItem = packages.value.splice(oldIndex, 1)[0]
      packages.value.splice(newIndex, 0, movedItem)
      
      // 保存到后端
      await savePackagesOrder()
    }
  })
}

// 保存套餐排序到后端
const savePackagesOrder = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packages.value)
    })
    const result = await res.json()
    if (result.success) {
      ElMessage.success('排序已保存')
    } else {
      ElMessage.error('保存排序失败')
    }
  } catch (error) {
    console.error('保存排序失败:', error)
    ElMessage.error('网络请求失败')
  }
}

const showAddPackageDialog = () => {
  isEdit.value = false
  Object.assign(packageForm, { id: '', name: '', entertainment: '桌游', price: 0, duration: 120, description: '' })
  showPackageDialog.value = true
}

const editPackage = (row: any) => {
  isEdit.value = true
  Object.assign(packageForm, row)
  showPackageDialog.value = true
}

const submitPackageForm = async () => {
  if (!packageFormRef.value) return
  await packageFormRef.value.validate(async (valid) => {
    if (valid) {
      const url = isEdit.value 
        ? `http://localhost:3000/api/packages/${packageForm.id}`
        : 'http://localhost:3000/api/packages/create'
      const method = isEdit.value ? 'PUT' : 'POST'
      
      // 如果是新增，自动生成套餐ID
      const submitData = isEdit.value 
        ? packageForm 
        : { ...packageForm, id: `PKG${String(packages.value.length + 1).padStart(3, '0')}` }
      
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        })
        const result = await res.json()
        if (result.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
          showPackageDialog.value = false
          loadPackages()
        } else {
          ElMessage.error(result.message)
        }
      } catch (error) {
        ElMessage.error('网络请求失败')
      }
    }
  })
}

const deletePackage = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除套餐 "${row.name}" 吗？`, '警告', { type: 'warning' })
    const res = await fetch(`http://localhost:3000/api/packages/${row.id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) {
      ElMessage.success('删除成功')
      loadPackages()
    }
  } catch (error) {}
}

const getEntertainmentType = (entertainment: string) => {
  const typeMap: Record<string, any> = {
    '桌游': '',
    'PS5': 'success',
    '拼豆': 'warning',
    '其他': 'info'
  }
  return typeMap[entertainment] || ''
}

// 实时预览：修改主题配置时立即生效（不持久化）
watch(
  () => ({ ...themeConfig }),
  (val) => {
    applyTheme({
      primaryColor: val.primaryColor,
      backgroundStyle: val.backgroundStyle as 'light' | 'dark' | 'gradient',
    })
  },
)

const handleSaveTheme = () => {
  saveTheme({
    primaryColor: themeConfig.primaryColor,
    backgroundStyle: themeConfig.backgroundStyle as 'light' | 'dark' | 'gradient',
  })
  ElMessage.success('主题设置已保存')
}

// ========== 备份管理 ==========
const API_BASE = 'http://localhost:3000/api/backup'

const backupConfig = ref({
  autoMonitorEnabled: true,
  usbBackupEnabled: true,
  scheduleEnabled: false,
  scheduleTime: '02:00',
  maxBackupCount: 30,
  lastBackupTime: null as string | null,
  lastBackupStatus: null as string | null,
})

const usbDrives = ref<any[]>([])
const backupHistory = ref<{ list: any[]; total: number; page: number; pageSize: number }>({
  list: [],
  total: 0,
  page: 1,
  pageSize: 20,
})
const backupLoading = ref<string | null>(null)
const usbLoading = ref(false)
const restorePoints = ref<any[]>([])
const restoreLoading = ref(false)
const restoringPath = ref<string | null>(null)
const showPreviewDialog = ref(false)
const previewFiles = ref<{ name: string; size: number }[]>([])

const loadBackupConfig = async () => {
  try {
    const res = await fetch(`${API_BASE}/config`)
    const result = await res.json()
    if (result.success) {
      backupConfig.value = { ...backupConfig.value, ...result.data }
    }
  } catch (e) {
    console.error('加载备份配置失败:', e)
  }
}

const saveBackupConfig = async () => {
  try {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupConfig.value),
    })
    const result = await res.json()
    if (result.success) {
      ElMessage.success('备份配置已保存')
    }
  } catch (e) {
    console.error('保存备份配置失败:', e)
  }
}

const refreshUsbDrives = async () => {
  usbLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/usb-drives`)
    const result = await res.json()
    if (result.success) {
      usbDrives.value = result.data.drives || []
    }
  } catch (e) {
    console.error('获取U盘列表失败:', e)
  } finally {
    usbLoading.value = false
  }
}

const manualBackup = async (target: 'local' | 'usb') => {
  backupLoading.value = target
  try {
    const res = await fetch(`${API_BASE}/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
    })
    const result = await res.json()
    if (result.success) {
      ElMessage.success(result.message || '备份完成')
      loadBackupConfig()
      loadBackupHistory()
    } else {
      ElMessage.error(result.message || '备份失败')
    }
  } catch (e) {
    ElMessage.error('备份请求失败')
  } finally {
    backupLoading.value = null
  }
}

const loadBackupHistory = async (page = 1) => {
  try {
    const res = await fetch(`${API_BASE}/history?page=${page}&pageSize=${backupHistory.value.pageSize}`)
    const result = await res.json()
    if (result.success) {
      backupHistory.value = result.data
    }
  } catch (e) {
    console.error('加载备份历史失败:', e)
  }
}

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const loadRestorePoints = async () => {
  restoreLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/restore-points`)
    const result = await res.json()
    if (result.success) restorePoints.value = result.data
  } catch (e) {
    console.error('加载还原点失败:', e)
  } finally {
    restoreLoading.value = false
  }
}

const openPreviewDialog = async (backupPath: string) => {
  try {
    const res = await fetch(`${API_BASE}/preview?path=${encodeURIComponent(backupPath)}`)
    const result = await res.json()
    if (result.success) {
      previewFiles.value = result.files
      showPreviewDialog.value = true
    } else {
      ElMessage.error(result.message || '预览失败')
    }
  } catch {
    ElMessage.error('预览请求失败')
  }
}

const handleRestore = async (backupPath: string, timestamp: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要从备份 "${timestamp}" 恢复数据吗？当前数据将被覆盖。系统会在恢复前自动创建安全备份。`,
      '确认数据还原',
      { confirmButtonText: '确定还原', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  restoringPath.value = backupPath
  try {
    const res = await fetch(`${API_BASE}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: backupPath }),
    })
    const result = await res.json()
    if (result.success) {
      ElMessage.success(result.message || '数据还原成功')
      loadBackupHistory()
      loadRestorePoints()
    } else {
      ElMessage.error(result.message || '数据还原失败')
    }
  } catch {
    ElMessage.error('还原请求失败')
  } finally {
    restoringPath.value = null
  }
}

// 切换到备份 tab 时加载数据
watch(activeTab, (tab) => {
  if (tab === 'backup') {
    loadBackupConfig()
    refreshUsbDrives()
    loadBackupHistory()
    loadRestorePoints()
  }
})


onMounted(() => {
  loadPackages()
})
</script>

<style scoped>
.settings-page {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.settings-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}
:deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
}
.tab-content {
  padding: 20px 0;
}
.action-bar {
  margin-bottom: 20px;
}
.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.theme-content {
  max-width: 600px;
}

/* 拖拽手柄样式 */
.drag-handle {
  font-size: 18px;
  color: #909399;
  transition: color 0.3s;
}

.drag-handle:hover {
  color: #409eff;
}

/* 拖拽时的行样式 */
:deep(.sortable-ghost) {
  opacity: 0.5;
  background-color: #f0f9ff;
}

:deep(.sortable-chosen) {
  background-color: #ecf5ff;
}
</style>
