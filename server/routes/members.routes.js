import { Router } from 'express'
import * as memberService from '../services/memberService.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    const data = memberService.getMembers()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取会员列表失败' })
  }
})

router.post('/', (req, res) => {
  try {
    const data = memberService.createMember(req.body)
    res.json({ success: true, data })
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || '添加会员失败' })
  }
})

router.put('/:id', (req, res) => {
  try {
    const data = memberService.updateMember(req.params.id, req.body)
    res.json({ success: true, data })
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || '更新会员失败' })
  }
})

router.delete('/:id', (req, res) => {
  try {
    memberService.deleteMember(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || '删除会员失败' })
  }
})

export default router
