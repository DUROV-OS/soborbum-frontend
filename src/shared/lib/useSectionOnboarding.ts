import { useEffect, useState } from 'react'

const STORAGE_PREFIX = 'soborbum.onboarding.'

/**
 * Показывает обучающее окно раздела при первом заходе (флаг хранится в localStorage)
 * и позволяет открыть его повторно по кнопке «Помощь».
 */
export function useSectionOnboarding(sectionId: string) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let seen = true
    try {
      seen = localStorage.getItem(STORAGE_PREFIX + sectionId) === '1'
    } catch {
      // localStorage недоступен (приватный режим и т.п.) — просто не показываем автообучение
    }
    if (!seen) setOpen(true)
  }, [sectionId])

  function close() {
    setOpen(false)
    try {
      localStorage.setItem(STORAGE_PREFIX + sectionId, '1')
    } catch {
      // игнорируем — это не критично, окно просто будет показываться каждый раз
    }
  }

  function show() {
    setOpen(true)
  }

  return { open, show, close }
}
