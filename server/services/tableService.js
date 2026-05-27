import { readData, writeData } from './fileStore.js'

export function getTables() {
  return readData('tables')
}

export function saveTables(tables) {
  writeData('tables', tables)
  return tables
}
