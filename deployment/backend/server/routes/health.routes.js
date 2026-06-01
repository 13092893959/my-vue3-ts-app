import { Router } from 'express'
import { DATA_FILES } from '../constants.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ ok: true, dataFiles: DATA_FILES })
})

export default router
