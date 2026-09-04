import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'

const STORAGE_KEY = 'board.hideMobileWarning'
const MOBILE_QUERY = '(max-width: 1023px)'

function isDismissedForever(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function MobileWarningModal() {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    if (!isDismissedForever() && window.matchMedia(MOBILE_QUERY).matches) {
      setOpen(true)
    }
  }, [])

  function handleClose() {
    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true')
      } catch {
        // localStorage может быть недоступен (приватный режим) — просто не запоминаем выбор
      }
    }
    setOpen(false)
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Совет директоров"
      width="max-w-sm"
      footer={<Button onClick={handleClose}>Хорошо</Button>}
    >
      <p className="text-[13px] leading-relaxed text-ink">
        Рекомендуем открывать этот раздел с десктопной версии (ноутбук/компьютер) — дерево
        направлений неудобно читать и редактировать на маленьком экране.
      </p>
      <label className="mt-4 flex items-center gap-2 text-[13px] text-muted">
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={(e) => setDontShowAgain(e.target.checked)}
          className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
        />
        Больше не показывать
      </label>
    </Modal>
  )
}
