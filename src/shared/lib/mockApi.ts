/**
 * Симулятор сетевого слоя поверх mock-хранилища.
 * Каждая функция в api/*.ts доменов оборачивает обращение к in-memory
 * базе через `withLatency`, чтобы UI уже сегодня работал так, как будет
 * работать с реальным HTTP-клиентом (async/await, задержка, единая точка
 * для будущей обработки ошибок сети).
 */
export function withLatency<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

let counter = 0

export function generateId(prefix: string): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
