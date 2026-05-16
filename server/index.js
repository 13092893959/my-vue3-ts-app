import express from 'express'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const validUser = {
  username: 'admin',
  password: '123456',
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body

  if (username === validUser.username && password === validUser.password) {
    return res.json({ success: true })
  }

  return res.status(401).json({ success: false, message: '用户名或密码错误' })
})

app.get('/api/health', (_, res) => {
  res.json({ ok: true })
})

app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}`)
})