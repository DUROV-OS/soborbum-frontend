import { AgentId, AgentPassport, GoldProgress, PlanItem } from './types'

export const AGENTS: AgentPassport[] = [
  {
    id: 'coordinator',
    title: 'Координатор',
    role: 'Лицо команды',
    owns: 'Маршрут, общий контекст, синтез, след. Не выпускает ответ с юридическим риском.',
    doesNotOwn: 'Доменные решения продаж, цеха, склада, права, инженерии.',
    dailyQuestion: 'Что сейчас самое важное и какой специалист это закрывает?',
    tone: 'brand',
  },
  {
    id: 'sales',
    title: 'Продажник',
    role: 'Воронка',
    owns: 'Стадия сделки, следующее действие, черновик КП в утверждённых границах.',
    doesNotOwn: 'Окончательная цена, скидка сверх 5%, срок без проверки цеха.',
    dailyQuestion: 'Какие сделки зависли и что мешает закрыть ближайшую оплату?',
    tone: 'info',
  },
  {
    id: 'marketer',
    title: 'Маркетолог',
    role: 'Контент',
    owns: 'Черновики на утверждённых фактах бренда и продукта.',
    doesNotOwn: 'Ворованные данные конкурентов, публикация в соцсети, смена прайса.',
    dailyQuestion: 'Какой следующий контакт с рынком опирается на факт, а не на домысел?',
    tone: 'info',
  },
  {
    id: 'production',
    title: 'Производственник',
    role: 'Цех',
    owns: 'Загрузка, модули, реалистичный срок цеха, заявка на материал.',
    doesNotOwn: 'Обещание даты клиенту, изменение техкарты.',
    dailyQuestion: 'Что сегодня тормозит ближайший дом?',
    tone: 'timber',
  },
  {
    id: 'warehouse',
    title: 'Кладовщик',
    role: 'Склад',
    owns: 'Остатки, ответ по заявке цеха, приход.',
    doesNotOwn: 'Оплата поставщику, смена состава изделия.',
    dailyQuestion: 'Чего не хватит ближайшему дому и что уже едет?',
    tone: 'timber',
  },
  {
    id: 'finance',
    title: 'Финансист',
    role: 'Маржа',
    owns: 'Юнит-экономика, эффект скидки, флаг убитой маржи.',
    doesNotOwn: 'Банк, инвестиция, окончательная цена клиенту.',
    dailyQuestion: 'Где утекает маржа — в скидке, сроке или неоплате?',
    tone: 'timber',
  },
  {
    id: 'lawyer',
    title: 'Юрист',
    role: 'Ворота',
    owns: 'Вердикт legal gate: allow / block / escalate. Паспорт проверки.',
    doesNotOwn: 'Коммерческую рекомендацию. Подпись на договоре.',
    dailyQuestion: 'Какое действие нельзя выпускать как есть?',
    tone: 'danger',
  },
  {
    id: 'engineer',
    title: 'Инженер',
    role: 'Норма',
    owns: 'Сверка узла с техкартой и СП/ГОСТ.',
    doesNotOwn: 'Запуск в производство, выдача нестандарта как типового.',
    dailyQuestion: 'Какое отклонение от техкарты опасно на площадке?',
    tone: 'info',
  },
]

export const AGENT_WATCHES: Record<AgentId, string> = {
  coordinator: 'Сводит картину: что сейчас главное',
  sales: 'Смотрит зависшие сделки и оплаты',
  marketer: 'Ищет следующий контакт с рынком на факте',
  production: 'Смотрит, что тормозит ближайший дом',
  warehouse: 'Смотрит, чего не хватит и что уже едет',
  finance: 'Ищет, где утекает маржа',
  lawyer: 'Проверяет, можно ли выпускать без вас',
  engineer: 'Сверяет узел с техкартой',
}

export const AGENT_LIMITS: Record<AgentId, string> = {
  coordinator: 'Не подменяет цех, склад, юриста и продажи',
  sales: 'Не ставит окончательную цену и скидку больше 5%',
  marketer: 'Не берёт ворованную базу и не публикует сам',
  production: 'Не обещает дату клиенту',
  warehouse: 'Не платит поставщику',
  finance: 'Не ходит в банк и не ставит цену клиенту',
  lawyer: 'Не подписывает договор и не даёт коммерческий совет',
  engineer: 'Не запускает нестандарт как типовой узел',
}

export const SPECIALISTS = AGENTS.filter((agent) => agent.id !== 'coordinator')

export const PLAN_DONE: PlanItem[] = [
  {
    id: 'roster',
    title: 'Восемь паспортов зафиксированы',
    detail: 'Список MVP закрыт. HR и закупщик не добавляем.',
    done: true,
  },
  {
    id: 'gate',
    title: 'Юрист работает как фильтр',
    detail: 'Ворованные данные конкурентов — block до черновика.',
    done: true,
  },
  {
    id: 'context',
    title: 'Общий контекст описан',
    detail: 'База — истина. CRM и склад читаются для свежести.',
    done: true,
  },
  {
    id: 'labeling',
    title: 'Контракт разметки написан',
    detail: 'Legal gold не ставит ML-инженер. SLA 2 и 5 дней.',
    done: true,
  },
  {
    id: 'repo',
    title: 'Публичный репозиторий agents',
    detail: 'Рантайм, CLI, 19 тестов, стартовый gold.',
    done: true,
  },
  {
    id: 'ui',
    title: 'Вкладка «Агенты» в Soborbum',
    detail: 'Карта команды и админ-панель. Не внутри совета директоров.',
    done: true,
  },
  {
    id: 'api',
    title: 'Ручка следов в бэкенде',
    detail: 'POST/GET /api/agents/runs — живые маршруты вместо витрины.',
    done: true,
  },
  {
    id: 'shift',
    title: 'Смена компании',
    detail: 'Восемь ролей, крест, очередь человеку. Не чатбот.',
    done: true,
  },
]

export const PLAN_NEXT: PlanItem[] = [
  {
    id: 'llm',
    title: 'Одна общая модель с цитатами',
    detail: 'Не восемь обученных сетей. Ключ Claude — тот же, что у Марины. Нет ключа — паспорт + база.',
    done: false,
  },
  {
    id: 'connectors',
    title: 'amoCRM и МойСклад в gather()',
    detail: 'Читает для свежести, не пишет. Без токена сделок и остатков не выдумывает.',
    done: true,
  },
  {
    id: 'gold',
    title: '50 gold на роль, 30 legal gold',
    detail: 'Пока 10 seed-примеров. κ ≥ 0.70. Иначе не говорим «обучен».',
    done: false,
  },
  {
    id: 'marina',
    title: 'Стыковка с Мариной',
    detail: 'Консультация живёт во вкладке Агентов: один чат, без новых переписок.',
    done: true,
  },
]

/** Честные цифры с seed.jsonl репозитория agents, не «как будто уже обучено». */
export const GOLD: GoldProgress[] = [
  { id: 'coordinator', title: 'Координатор', gold: 0, target: 50 },
  { id: 'sales', title: 'Продажник', gold: 4, target: 50 },
  { id: 'marketer', title: 'Маркетолог', gold: 3, target: 50 },
  { id: 'production', title: 'Производственник', gold: 1, target: 50 },
  { id: 'warehouse', title: 'Кладовщик', gold: 1, target: 50 },
  { id: 'finance', title: 'Финансист', gold: 2, target: 50 },
  { id: 'lawyer', title: 'Юрист', gold: 6, target: 50 },
  { id: 'engineer', title: 'Инженер', gold: 1, target: 50 },
]

export const LEGAL_GOLD = { have: 6, target: 30 }

