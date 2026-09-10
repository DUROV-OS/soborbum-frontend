/**
 * Тонкая обёртка над getUserMedia + MediaRecorder для режима «Совещание».
 * Живёт вне React (модульный синглтон), чтобы запись переживала переходы между
 * разделами. Транскрибация браузером (Web Speech API) — отдельно, в 0004-b.
 */

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
]

export interface ActiveRecording {
  mimeType: string
  /** Останавливает запись, глушит микрофон и отдаёт собранный блоб. */
  stop: () => Promise<Blob>
}

interface RecorderState {
  recorder: MediaRecorder
  stream: MediaStream
  chunks: Blob[]
}

let current: RecorderState | null = null

export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== 'undefined'
  )
}

export function isRecording(): boolean {
  return current !== null
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder.isTypeSupported !== 'function') return undefined
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type))
}

/** Запрашивает доступ к микрофону и запускает запись. Бросает при отказе. */
export async function startRecording(): Promise<ActiveRecording> {
  if (current) throw new Error('Запись совещания уже идёт')

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks: Blob[] = []
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  })
  recorder.start()
  current = { recorder, stream, chunks }

  const effectiveType = recorder.mimeType || mimeType || 'audio/webm'

  return {
    mimeType: effectiveType,
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        const state = current
        if (!state) {
          reject(new Error('Запись уже остановлена'))
          return
        }
        state.recorder.addEventListener(
          'stop',
          () => {
            state.stream.getTracks().forEach((track) => track.stop())
            current = null
            resolve(new Blob(state.chunks, { type: state.recorder.mimeType || effectiveType }))
          },
          { once: true },
        )
        state.recorder.stop()
      }),
  }
}

/** Аварийный сброс — заглушить микрофон, ничего не отдавая (напр. при ошибке). */
export function abortRecording(): void {
  if (!current) return
  try {
    if (current.recorder.state !== 'inactive') current.recorder.stop()
  } catch {
    /* уже неактивен */
  }
  current.stream.getTracks().forEach((track) => track.stop())
  current = null
}

export function extensionForMime(mimeType: string): string {
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4')) return 'mp4'
  return 'webm'
}
