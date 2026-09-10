/**
 * Живое распознавание речи для режима «Совещание» через браузерный
 * Web Speech API (webkitSpeechRecognition). Живёт вне React — управляется
 * стором, как и recorder.ts, чтобы переживать переходы между разделами.
 *
 * Транскрибация идёт целиком в браузере; на бэк уходят уже готовые реплики
 * (см. store.ts / api.ts). Диаризации у API нет — «Спикер N» назначает стор
 * по паузам.
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
}

export function speechRecognitionAvailable(): boolean {
  return getSpeechRecognitionCtor() !== null
}

const NO_OP: LiveTranscription = { stop: () => {} }

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
  let lastFinalEnd = opts.startedAt

  recognition.onresult = (event) => {
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
    // 'no-speech' | 'aborted' | 'network' — не фатально, onend перезапустит.
  }

  recognition.onend = () => {
    opts.onInterim('')
    if (stopped) return
    // Браузер сам глушит continuous-распознавание через ~1 мин тишины —
    // поднимаем заново, пока идёт совещание.
    try {
      recognition.start()
    } catch {
      /* уже запущено */
    }
  }

  try {
    recognition.start()
  } catch {
    /* уже запущено */
  }

  return {
    stop: () => {
      stopped = true
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.abort()
      } catch {
        /* noop */
      }
    },
  }
}
