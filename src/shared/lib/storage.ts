/**
 * Персист mock-данных в localStorage, чтобы кликабельный прототип
 * переживал перезагрузку страницы. Единая точка, которую можно убрать
 * целиком, когда данные начнут приходить с реального backend.
 */
export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — тихо игнорируем,
    // данные останутся только в памяти на текущую сессию
  }
}

export function clearState(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // см. saveState
  }
}
