import {
  Boxes,
  CalendarDays,
  ClipboardList,
  Factory,
  Landmark,
  Megaphone,
  Repeat,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'

/**
 * Единый реестр разделов системы — используется матрицей доступа (auth/)
 * и боковым меню (app/Sidebar). Значения (кроме 'admin' и 'today') совпадают
 * буква в букву с enum Module на бэкенде — это то, что реально приходит в
 * module_access и в Task.link_type, так что переименовывать их нельзя.
 * 'admin' — чисто фронтовое значение для пункта меню «Доступ», бэкенд его
 * не знает: администраторская страница гейтится по role==='admin'.
 * 'today' — тоже чисто фронтовое значение (эндпоинт GET /api/dashboard/today
 * гейтится на бэкенде модулем AI), hasAccess('today') в auth/store.ts
 * проксируется на доступ к 'ai', поэтому в матрицу назначаемых модулей
 * (ASSIGNABLE_SECTIONS) 'today' не попадает — им нельзя управлять отдельно.
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
  | 'ai'
  | 'today'
  | 'board'

export interface SectionMeta {
  id: SectionId
  label: string
  path: string
  icon: LucideIcon
  /** Разделы, которые не входят в матрицу доступа рабочих (управляются только ролью) */
  adminOnly?: boolean
  /** Разделы, которыми нельзя управлять по отдельности в матрице доступа (доступ выводится из другого раздела) */
  notAssignable?: boolean
}

export const SECTIONS: SectionMeta[] = [
  { id: 'today', label: 'Сегодня', path: '/today', icon: CalendarDays, notAssignable: true },
  { id: 'cycle', label: 'Цикл клиента', path: '/cycles', icon: Repeat },
  { id: 'clients', label: 'Клиенты', path: '/clients', icon: Users },
  { id: 'production', label: 'Производство', path: '/production', icon: Factory },
  { id: 'installation', label: 'Монтаж', path: '/montage', icon: Truck },
  { id: 'warehouse', label: 'Склад', path: '/warehouse', icon: Boxes },
  { id: 'marketing', label: 'Маркетинг', path: '/marketing', icon: Megaphone },
  { id: 'tasks', label: 'Задачи', path: '/tasks', icon: ClipboardList },
  { id: 'board', label: 'Совет директоров', path: '/board', icon: Landmark },
  { id: 'ai', label: 'ИИ-ассистент', path: '/ai', icon: Sparkles },
  { id: 'admin', label: 'Доступ', path: '/admin', icon: ShieldCheck, adminOnly: true },
]

export const ASSIGNABLE_SECTIONS = SECTIONS.filter((s) => !s.adminOnly && !s.notAssignable)

export function sectionById(id: SectionId): SectionMeta {
  const section = SECTIONS.find((s) => s.id === id)
  if (!section) throw new Error(`Unknown section: ${id}`)
  return section
}
