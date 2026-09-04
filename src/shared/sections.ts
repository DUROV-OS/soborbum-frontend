import {
  Boxes,
  ClipboardList,
  Factory,
  Megaphone,
  Repeat,
  ShieldCheck,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'

/**
 * Единый реестр разделов системы — используется матрицей доступа (auth/)
 * и боковым меню (app/Sidebar). Значения (кроме 'admin') совпадают буква
 * в букву с enum Module на бэкенде — это то, что реально приходит в
 * module_access и в Task.link_type, так что переименовывать их нельзя.
 * 'admin' — чисто фронтовое значение для пункта меню «Доступ», бэкенд его
 * не знает: администраторская страница гейтится по role==='admin'.
 */
export type SectionId =
  | 'clients'
  | 'production'
  | 'installation'
  | 'cycle'
  | 'warehouse'
  | 'marketing'
  | 'tasks'
  | 'admin'

export interface SectionMeta {
  id: SectionId
  label: string
  path: string
  icon: LucideIcon
  /** Разделы, которые не входят в матрицу доступа рабочих (управляются только ролью) */
  adminOnly?: boolean
}

export const SECTIONS: SectionMeta[] = [
  { id: 'cycle', label: 'Цикл клиента', path: '/cycles', icon: Repeat },
  { id: 'clients', label: 'Клиенты', path: '/clients', icon: Users },
  { id: 'production', label: 'Производство', path: '/production', icon: Factory },
  { id: 'installation', label: 'Монтаж', path: '/montage', icon: Truck },
  { id: 'warehouse', label: 'Склад', path: '/warehouse', icon: Boxes },
  { id: 'marketing', label: 'Маркетинг', path: '/marketing', icon: Megaphone },
  { id: 'tasks', label: 'Задачи', path: '/tasks', icon: ClipboardList },
  { id: 'admin', label: 'Доступ', path: '/admin', icon: ShieldCheck, adminOnly: true },
]

export const ASSIGNABLE_SECTIONS = SECTIONS.filter((s) => !s.adminOnly)

export function sectionById(id: SectionId): SectionMeta {
  const section = SECTIONS.find((s) => s.id === id)
  if (!section) throw new Error(`Unknown section: ${id}`)
  return section
}
