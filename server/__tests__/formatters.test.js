import { describe, it, expect } from 'vitest'
import { formatDateTime, successResponse, errorResponse } from '../utils/formatters.js'

describe('formatDateTime', () => {
  it('returns yyyy-MM-dd HH:mm:ss format', () => {
    const d = new Date(2025, 0, 15, 14, 30, 45) // Jan = 0
    const result = formatDateTime(d)
    expect(result).toBe('2025-01-15 14:30:45')
  })

  it('pads single-digit values', () => {
    const d = new Date(2025, 0, 1, 3, 5, 7)
    const result = formatDateTime(d)
    expect(result).toBe('2025-01-01 03:05:07')
  })

  it('defaults to current date when no argument', () => {
    const result = formatDateTime()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })
})

describe('response helpers', () => {
  it('successResponse returns expected shape', () => {
    const res = { json: (d) => d }
    const result = successResponse(res, { id: 1 }, 'created')
    expect(result).toEqual({ success: true, data: { id: 1 }, message: 'created' })
  })

  it('errorResponse returns expected shape', () => {
    const res = { status: () => ({ json: (d) => d }) }
    const statusFn = res.status(400)
    const result = statusFn.json()
    const expected = errorResponse({ status: () => ({ json: (d) => d }) }, 'bad request', 400)
    expect(expected.success).toBe(false)
    expect(expected.message).toBe('bad request')
  })
})
