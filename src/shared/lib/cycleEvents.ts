/**
 * Тонкая шина событий жизненного цикла клиента — вторая (после
 * taskSync.ts) точка связи между разделами, которые иначе не должны
 * знать друг о друге:
 *  - Клиенты доходят до стадии «постоплата» → Производство создаёт
 *    сущность производства для этого клиента.
 *  - Производство закрывает все модули → Монтаж создаёт сущность
 *    монтажа для этого клиента.
 * cycles/ читает получившиеся сущности через публичные api-функции
 * clients/production/montage, а не через эту шину — она нужна только
 * для триггера создания.
 */

type Unsubscribe = () => void

const postpaymentListeners = new Set<(clientId: string) => void>()
const productionCompletedListeners = new Set<(clientId: string) => void>()

export function emitClientReachedPostpayment(clientId: string): void {
  postpaymentListeners.forEach((fn) => fn(clientId))
}

export function onClientReachedPostpayment(fn: (clientId: string) => void): Unsubscribe {
  postpaymentListeners.add(fn)
  return () => postpaymentListeners.delete(fn)
}

export function emitProductionCompleted(clientId: string): void {
  productionCompletedListeners.forEach((fn) => fn(clientId))
}

export function onProductionCompleted(fn: (clientId: string) => void): Unsubscribe {
  productionCompletedListeners.add(fn)
  return () => productionCompletedListeners.delete(fn)
}
