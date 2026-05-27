import { readData, writeData } from './fileStore.js'
import { generateId } from '../utils/idGenerator.js'
import { formatDateTime } from '../utils/formatters.js'

export function getMembers() {
  return readData('members')
}

export function createMember(data) {
  if (!data.name && !data.phone) {
    throw Object.assign(new Error('姓名和手机号至少填写一个'), { status: 400 })
  }

  const members = readData('members')
  if (data.phone && members.find((m) => m.phone === data.phone)) {
    throw Object.assign(new Error('该手机号已办理会员卡'), { status: 400 })
  }

  const member = { ...data, id: generateId(), createTime: formatDateTime() }
  members.push(member)
  writeData('members', members)
  return member
}

export function updateMember(id, updates) {
  const members = readData('members')
  const index = members.findIndex((m) => String(m.id) === String(id))
  if (index === -1) {
    throw Object.assign(new Error('会员不存在'), { status: 404 })
  }
  members[index] = { ...members[index], ...updates, id: members[index].id }
  writeData('members', members)
  return members[index]
}

export function deleteMember(id) {
  const members = readData('members')
  const index = members.findIndex((m) => String(m.id) === String(id))
  if (index === -1) {
    throw Object.assign(new Error('会员不存在'), { status: 404 })
  }
  members.splice(index, 1)
  writeData('members', members)
}
