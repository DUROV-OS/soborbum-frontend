/** Вложение сообщения MAX. Поля приходят выборочно — бэк отдаёт только
 * непустые (см. app/max/service.py `_fmt_attach`). */
export interface MaxAttach {
  type?: string
  name?: string
  fileId?: number
  photoId?: number
  videoId?: number
  audioId?: number
  size?: number
  baseUrl?: string
  url?: string
  title?: string
}

/** Одно сообщение чата MAX (см. `_fmt_msg`). `sender` — id участника,
 * `time` — Unix-время в миллисекундах. */
export interface MaxMessage {
  id: string
  time: number
  sender: number
  type?: string
  status?: string
  text: string
  elements: unknown[]
  attaches: MaxAttach[]
}

/** Ответ GET /api/max/chats/:id — история одного чата. */
export interface MaxChatHistory {
  chatId: number
  title: string | null
  count: number
  messages: MaxMessage[]
}

/** Ответ POST /api/max/messages — отправленное сообщение. */
export interface MaxSendResult {
  chatId: number
  message: MaxMessage | null
}
