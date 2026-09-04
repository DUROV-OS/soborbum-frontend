/**
 * Из бэкенда нет способа увидеть чужой пароль, поэтому быстрый вход и
 * переключение ролей в демо построены на захардкоженном списке заранее
 * заведённых учётных записей — не на реальном списке пользователей.
 */
export const QUICK_LOGIN = [
  { label: 'Артём Дуров', title: 'Администратор', email: 'admin@soborbum.local', password: 'admin123' },
  { label: 'Ирина Волкова', title: 'Менеджер по продажам', email: 'sales@example.com', password: 'soborbum2026' },
  { label: 'Павел Гринёв', title: 'Начальник цеха', email: 'foreman@example.com', password: 'soborbum2026' },
  { label: 'Роман Северов', title: 'Бригадир монтажа', email: 'installer@example.com', password: 'soborbum2026' },
  { label: 'Светлана Ким', title: 'Кладовщик', email: 'warehouse@example.com', password: 'soborbum2026' },
  { label: 'Ксения Лебедева', title: 'Маркетолог', email: 'marketing@example.com', password: 'soborbum2026' },
]
