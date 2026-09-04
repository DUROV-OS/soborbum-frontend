import { SectionId } from '@/shared/sections'

export type Role = 'admin' | 'worker'

export interface Account {
  id: string
  name: string
  title: string
  role: Role
  /** Доступ либо есть, либо нет — не частичный. Для admin игнорируется, доступ полный. */
  sectionAccess: SectionId[]
}
