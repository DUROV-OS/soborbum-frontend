import { Account } from './types'

export const SEED_ACCOUNTS: Account[] = [
  {
    id: 'acc_admin',
    name: 'Артём Дуров',
    title: 'Администратор',
    role: 'admin',
    sectionAccess: [],
  },
  {
    id: 'acc_sales',
    name: 'Ирина Волкова',
    title: 'Менеджер по продажам',
    role: 'worker',
    sectionAccess: ['clients', 'cycles', 'tasks'],
  },
  {
    id: 'acc_foreman',
    name: 'Павел Гринёв',
    title: 'Начальник цеха',
    role: 'worker',
    sectionAccess: ['production', 'tasks'],
  },
  {
    id: 'acc_installer',
    name: 'Роман Северов',
    title: 'Бригадир монтажа',
    role: 'worker',
    sectionAccess: ['montage', 'tasks'],
  },
  {
    id: 'acc_warehouse',
    name: 'Светлана Ким',
    title: 'Кладовщик',
    role: 'worker',
    sectionAccess: ['warehouse', 'tasks'],
  },
  {
    id: 'acc_marketing',
    name: 'Ксения Лебедева',
    title: 'Маркетолог',
    role: 'worker',
    sectionAccess: ['marketing', 'tasks'],
  },
]
