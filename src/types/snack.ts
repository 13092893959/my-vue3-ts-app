/** 零食 */
export interface SnackItem {
  id: string | number
  snackId?: string
  name: string
  price: number
  unit: string
  quantity: number
  category?: string
  stock?: number
}
