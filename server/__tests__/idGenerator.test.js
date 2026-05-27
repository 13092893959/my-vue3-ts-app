import { describe, it, expect } from 'vitest'
import { generateId, generateNumericId } from '../utils/idGenerator.js'

describe('generateId', () => {
  it('returns a string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
  })

  it('includes prefix when provided', () => {
    const id = generateId('ORD')
    expect(id.startsWith('ORD')).toBe(true)
  })

  it('generates unique IDs on each call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('generateNumericId', () => {
  it('returns a number', () => {
    const id = generateNumericId()
    expect(typeof id).toBe('number')
  })

  it('is close to current timestamp', () => {
    const id = generateNumericId()
    expect(id).toBeGreaterThan(Date.now() - 1000)
    expect(id).toBeLessThan(Date.now() + 1000)
  })
})
