import { Router } from 'express'

const router = Router()

const validUser = { username: 'admin', password: '123456' }

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (username === validUser.username && password === validUser.password) {
    return res.json({ success: true })
  }
  return res.status(401).json({ success: false, message: '用户名或密码错误' })
})

export default router
