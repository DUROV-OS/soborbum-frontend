import { SectionId } from '@/shared/sections'

export type Role = 'admin' | 'worker'

export interface Account {
  id: number
  email: string
  full_name: string
  role: Role
  is_active: boolean
  created_at: string
  module_access: SectionId[]
}
