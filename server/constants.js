import path from 'path'

export const DATA_DIR = 'D:/data/baiwancheli'

export const DATA_FILES = {
  members: path.join(DATA_DIR, 'members.json'),
  rechargeRecords: path.join(DATA_DIR, 'recharge-records.json'),
  consumptionRecords: path.join(DATA_DIR, 'consumption-records.json'),
  tables: path.join(DATA_DIR, 'tables.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  snacks: path.join(DATA_DIR, 'snacks.json'),
  packages: path.join(DATA_DIR, 'packages.json'),
}

export const DATA_TYPES = Object.keys(DATA_FILES)
