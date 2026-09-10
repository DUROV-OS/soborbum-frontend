/**
 * Живое распознавание речи для режима «Совещание» через браузерный
 * Web Speech API (webkitSpeechRecognition). Живёт вне React — управляется
 * стором, как и recorder.ts, чтобы переживать переходы между разделами.
 *
 * Транскрибация идёт целиком в браузере; на бэк уходят уже готовые реплики
 * (см. store.ts / api.ts). Диаризации у API нет — «Спикер N» назначает стор
 * по паузам.
 *
 * Chrome капризен: после onend вызывать start() сразу нельзя (InvalidStateError),
 * а иногда распознавание молча зависает (ни onresult, ни onend) — например
 * когда параллельно играет speechSynthesis. Поэтому здесь: перезапуск с
 * задержкой и повтором + сторож, который принудительно поднимает поток, если
 * давно не было результатов.
 */
import { getSpeechRecognitionCtor, SpeechRecognitionLike } from '@/shared/lib/speechRecognition'

export interface FinalSegment {
  text: string
  /** смещение от начала сессии, мс */
  atMs: number
  /** тишина перед этой репликой (с конца предыдущей финальной), мс */
  gapMs: number
}

export interface StartOptions {
  startedAt: number
  onFinal: (segment: FinalSegment) => void
  onInterim: (text: string) => void
  /** Распознавание недоступно/запрещено — запись при этом продолжается. */
  onUnavailable: (reason: string) => void
}

export interface LiveTranscription {
  stop: () => void
  /** Пауза на время, пока говорит Марина (иначе микрофон дерётся с TTS). */
  setPaused: (paused: boolean) => void
}

const RESTART_DELAY_MS = 400
/** Нет ни одного результата столько времени → принудительный перезапуск. */
const WATCHDOG_MS = 12000

export function speechRecognitionAvailable(): boolean {
  return getSpeechRecognitionCtor() !== null
}

const NO_OP: LiveTranscription = { stop: () => {}, setPaused: () => {} }

export function startTranscription(opts: StartOptions): LiveTranscription {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) {
    opts.onUnavailable(
      'Распознавание речи недоступно в этом браузере — совещание записывается без транскрипта.',
    )
    return NO_OP
  }

  const recognition: SpeechRecognitionLike = new Ctor()
  recognition.lang = 'ru-RU'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  let stopped = false
  let paused = false
  let running = false
  let lastFinalEnd = opts.startedAt
  let lastActivity = Date.now()
  let restartTimer: ReturnType<typeof setTimeout> | null = null

  function safeStart() {
    if (stopped || paused || running) return
    try {
      recognition.start()
      running = true
    } catch {
      // ещё не отпустил прошлую сессию — попробуем позже
      scheduleRestart()
    }
  }

  function scheduleRestart() {
    if (restartTimer !== null || stopped || paused) return
    restartTimer = setTimeout(() => {
      restartTimer = null
      safeStart()
    }, RESTART_DELAY_MS)
  }

  recognition.onresult = (event) => {
    lastActivity = Date.now()
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const piece = event.results[i]
      const raw = piece[0]?.transcript ?? ''
      if (piece.isFinal) {
        const text = raw.trim()
        if (!text) continue
        const now = Date.now()
        opts.onFinal({
          text,
          atMs: Math.max(0, now - opts.startedAt),
          gapMs: Math.max(0, now - lastFinalEnd),
        })
        lastFinalEnd = now
      } else {
        interim += raw
      }
    }
    opts.onInterim(interim.trim())
  }

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      stopped = true
      opts.onUnavailable(
        'Нет доступа к распознаванию речи — совещание записывается без транскрипта.',
      )
      return
    }
    // 'no-speech' | 'aborted' | 'network' — не фатально, onend/сторож поднимут.
  }

  recognition.onend = () => {
    running = false
    opts.onInterim('')
    if (stopped || paused) return
    scheduleRestart()
  }

  // Сторож: если поток «завис» (нет результатов, но и onend не пришёл),
  // принудительно перезапускаем. Это и есть страховка от долгих провалов.
  const watchdog = setInterval(() => {
    if (stopped || paused) return
    if (Date.now() - lastActivity < WATCHDOG_MS) return
    lastActivity = Date.now()
    try {
      recognition.abort() // спровоцирует onend → scheduleRestart
    } catch {
      /* noop */
    }
    running = false
    scheduleRestart()
  }, 4000)

  safeStart()

  return {
    stop: () => {
      stopped = true
      clearInterval(watchdog)
      if (restartTimer !== null) clearTimeout(restartTimer)
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.abort()
      } catch {
        /* noop */
      }
    },
    setPaused: (next: boolean) => {
      if (next === paused) return
      paused = next
      if (paused) {
        if (restartTimer !== null) {
          clearTimeout(restartTimer)
          restartTimer = null
        }
        try {
          recognition.abort()
        } catch {
          /* noop */
        }
        running = false
      } else {
        lastActivity = Date.now()
        scheduleRestart()
      }
    },
  }
}
