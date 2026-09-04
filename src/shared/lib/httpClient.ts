export const API_BASE = 'http://localhost:8000/api'

const TOKEN_KEY = 'soborbum.auth.token'

let token: string | null = localStorage.getItem(TOKEN_KEY)

export function setToken(next: string | null): void {
  token = next
  if (next) localStorage.setItem(TOKEN_KEY, next)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getToken(): string | null {
  return token
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail.map((e: { msg?: string }) => e.msg).join('; ')
    }
    return response.statusText
  } catch {
    return response.statusText
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  section: string
  path: string
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  form?: FormData
}

function buildUrl(section: string, path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE}/${section}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (options.form) {
    body = options.form
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const response = await fetch(buildUrl(options.section, options.path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response))
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** POST /api/auth/login (application/x-www-form-urlencoded) */
export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  })
  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response))
  }
  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

/** Скачивает бинарный ответ (файл/шаблон) с авторизацией и запускает сохранение в браузере. */
export async function downloadFile(section: string, path: string, filename: string): Promise<void> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(buildUrl(section, path), { headers })
  if (!response.ok) throw new ApiError(response.status, await extractErrorMessage(response))
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Прикреплённые файлы (contract_file/house_project_file/raw_files/final_files/images) отдаются
 * не через /api/<section>, а через общий GET /files/:id на корне приложения — см. FileAssetOut.id.
 */
const API_ROOT = API_BASE.replace(/\/api$/, '')

/**
 * Скачивает прикреплённый файл по id (а не открывает во вкладке — рендеринг текстовых
 * файлов браузером не учитывает исходную кодировку и превращает кириллицу в кракозябры).
 */
export async function downloadFileById(fileId: number, filename: string): Promise<void> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_ROOT}/files/${fileId}`, { headers })
  if (!response.ok) throw new ApiError(response.status, await extractErrorMessage(response))
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
