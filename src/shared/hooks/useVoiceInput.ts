import { useCallback, useEffect, useRef, useState } from 'react'
import {
  browserSpeechAvailable,
  getSpeechRecognitionCtor,
  SpeechRecognitionLike,
} from '@/shared/lib/speechRecognition'
import {
  mediaRecorderAvailable,
  pickRecorderMimeType,
  transcribeWithWhisper,
} from '@/shared/lib/whisperFallback'

export type VoicePhase = 'idle' | 'listening' | 'transcribing' | 'error'

export interface VoiceInputState {
  phase: VoicePhase
  interim: string
  error: string | null
  supported: boolean
  mode: 'browser' | 'whisper' | 'none'
  toggle: () => void
  stop: () => void
}

/**
 * Free voice input: Web Speech API where the browser has it,
 * otherwise MediaRecorder + Whisper tiny in the browser (no paid keys).
 */
export function useVoiceInput(onFinal: (text: string) => void, lang = 'ru-RU'): VoiceInputState {
  const [phase, setPhase] = useState<VoicePhase>('idle')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mode: VoiceInputState['mode'] = browserSpeechAvailable()
    ? 'browser'
    : mediaRecorderAvailable()
      ? 'whisper'
      : 'none'
  const supported = mode !== 'none'

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
    recorderRef.current = null
    cleanupStream()
    setInterim('')
    setPhase((prev) => (prev === 'transcribing' ? prev : 'idle'))
  }, [cleanupStream])

  useEffect(() => () => stop(), [stop])

  const startBrowserSpeech = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    let finalized = ''
    recognition.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i]
        const transcript = piece[0]?.transcript ?? ''
        if (piece.isFinal) {
          finalized = `${finalized} ${transcript}`.trim()
          onFinalRef.current(transcript.trim())
        } else {
          interimText += transcript
        }
      }
      setInterim(interimText.trim())
    }
    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        setPhase('idle')
        return
      }
      setError(
        event.error === 'not-allowed'
          ? 'Нет доступа к микрофону — разрешите его в браузере.'
          : 'Не удалось распознать речь. Попробуйте ещё раз.',
      )
      setPhase('error')
      cleanupStream()
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setInterim('')
      setPhase((prev) => (prev === 'listening' ? 'idle' : prev))
    }

    recognitionRef.current = recognition
    setError(null)
    setPhase('listening')
    recognition.start()
  }, [cleanupStream, lang])

  const startWhisperCapture = useCallback(async () => {
    const mimeType = pickRecorderMimeType()
    if (!mimeType) {
      setError('Этот браузер не умеет записывать звук.')
      setPhase('error')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        cleanupStream()
        if (blob.size < 800) {
          setPhase('idle')
          return
        }
        setPhase('transcribing')
        void transcribeWithWhisper(blob)
          .then((text) => {
            if (text) onFinalRef.current(text)
            setPhase('idle')
          })
          .catch(() => {
            setError('Не удалось распознать речь. Проверьте сеть (первый раз скачивается модель) и попробуйте снова.')
            setPhase('error')
          })
      }
      setError(null)
      setPhase('listening')
      recorder.start()
    } catch {
      setError('Нет доступа к микрофону — разрешите его в браузере.')
      setPhase('error')
    }
  }, [cleanupStream])

  const toggle = useCallback(() => {
    if (phase === 'transcribing') return
    if (phase === 'listening') {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
        recorderRef.current = null
        return
      }
      stop()
      return
    }
    setError(null)
    if (mode === 'browser') startBrowserSpeech()
    else if (mode === 'whisper') void startWhisperCapture()
    else {
      setError('Голосовой ввод в этом браузере недоступен.')
      setPhase('error')
    }
  }, [mode, phase, startBrowserSpeech, startWhisperCapture, stop])

  return { phase, interim, error, supported, mode, toggle, stop }
}
