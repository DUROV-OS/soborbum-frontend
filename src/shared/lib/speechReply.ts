/**
 * Marina spoken résumé:
 * 1) Free neural female voice via backend Edge TTS (ru-RU-SvetlanaNeural)
 * 2) Fallback: browser speechSynthesis with soft feminine settings
 */

import { API_BASE, getToken } from '@/shared/lib/httpClient'

const FEMALE_NAME =
  /female|woman|girl|irina|milena|katya|ksenia|ksenya|tanya|anna|samantha|zira|helena|alena|yuliya|yulia|victoria|karen|moira|fiona|princess|neural.*ru|google.*(русский|russian).*female|microsoft.*(irina|elena|svetlana)/i
const MALE_NAME = /male|man|boy|dmitri|yuri|yury|pavel|nicholas|google.*(русский|russian)$/i

let currentAudio: HTMLAudioElement | null = null

/**
 * Встраиваемый выбор голоса. Пустой = поведение по умолчанию (нейро-Светлана
 * с фолбэком на «принцессу» браузера — как в разделе «Агенты»).
 * neuralVoice — имя Edge TTS voice для backend /ai/tts/speak.
 * systemVoiceURI — voiceURI системного голоса speechSynthesis (нейро пропускаем).
 */
export interface VoicePreference {
  neuralVoice?: string
  systemVoiceURI?: string
}

let preferredVoice: VoicePreference = {}

export function setPreferredVoice(pref: VoicePreference): void {
  preferredVoice = pref ?? {}
}

export function getPreferredVoice(): VoicePreference {
  return preferredVoice
}

export function speechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0
  const name = voice.name
  const lang = voice.lang.toLowerCase()
  if (lang.startsWith('ru')) score += 50
  else if (lang.startsWith('en')) score += 5
  if (FEMALE_NAME.test(name)) score += 40
  if (MALE_NAME.test(name) && !FEMALE_NAME.test(name)) score -= 30
  if (/premium|enhanced|neural|natural|online/i.test(name)) score += 15
  if (voice.localService) score += 3
  return score
}

export function pickPrincessVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null
  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null
}

export function stopSpeaking(): void {
  if (speechSynthesisAvailable()) window.speechSynthesis.cancel()
  if (currentAudio) {
    currentAudio.onended = null
    currentAudio.onerror = null
    currentAudio.pause()
    currentAudio.removeAttribute('src')
    currentAudio.load()
    currentAudio = null
  }
}

async function fetchNeuralMp3(text: string, voice?: string): Promise<Blob> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/ai/tts/speak`, {
    method: 'POST',
    headers,
    body: JSON.stringify(voice ? { text, voice } : { text }),
    signal: AbortSignal.timeout(45_000),
  })
  if (!response.ok) throw new Error(`tts ${response.status}`)
  return response.blob()
}

function speakBrowserFallback(
  text: string,
  options?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: () => void
  },
  systemVoiceURI?: string,
): void {
  if (!speechSynthesisAvailable() || !text.trim()) {
    options?.onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const run = () => {
    const utterance = new SpeechSynthesisUtterance(text.trim())
    utterance.lang = 'ru-RU'
    utterance.rate = 0.84
    utterance.pitch = 1.22
    utterance.volume = 1
    const voices = window.speechSynthesis.getVoices()
    const voice =
      (systemVoiceURI && voices.find((v) => v.voiceURI === systemVoiceURI)) ||
      pickPrincessVoice(voices)
    if (voice) {
      utterance.voice = voice
      if (voice.lang) utterance.lang = voice.lang
    }
    utterance.onstart = () => options?.onStart?.()
    utterance.onend = () => options?.onEnd?.()
    utterance.onerror = () => options?.onError?.()
    window.speechSynthesis.speak(utterance)
  }
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    run()
    return
  }
  const once = () => {
    window.speechSynthesis.removeEventListener('voiceschanged', once)
    run()
  }
  window.speechSynthesis.addEventListener('voiceschanged', once)
  window.setTimeout(run, 250)
}

/** Prefer free neural Svetlana; fall back to soft browser TTS. */
export async function speakPrincess(
  text: string,
  options?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: () => void
    /** Переопределить голос на этот вызов; иначе берётся setPreferredVoice(). */
    voice?: VoicePreference
  },
): Promise<void> {
  const cleaned = text.trim()
  if (!cleaned) {
    options?.onEnd?.()
    return
  }
  const pref = options?.voice ?? preferredVoice
  stopSpeaking()

  // Явно выбран системный голос — нейро не трогаем.
  if (pref.systemVoiceURI) {
    speakBrowserFallback(cleaned, options, pref.systemVoiceURI)
    return
  }

  try {
    const blob = await fetchNeuralMp3(cleaned, pref.neuralVoice)
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio
    audio.onplay = () => options?.onStart?.()
    audio.onended = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
      options?.onEnd?.()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
      speakBrowserFallback(cleaned, options, pref.systemVoiceURI)
    }
    await audio.play()
  } catch {
    speakBrowserFallback(cleaned, options, pref.systemVoiceURI)
  }
}

export function plainForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*_~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function splitVoiceReply(text: string): { spoken: string; written: string; hasExplicit: boolean } {
  const trimmed = text.trim()
  const explicit = trimmed.match(/^\s*Голосом:\s*(.+?)(?:\n\s*\n|\n(?=\S)|$)/is)
  if (explicit) {
    const spoken = plainForSpeech(explicit[1])
    const written = trimmed.slice(explicit[0].length).trim() || trimmed
    return { spoken, written, hasExplicit: true }
  }

  const plain = plainForSpeech(trimmed)
  const parts = plain.split(/(?<=[.!?…])\s+/).filter((part) => part.length > 0)
  let spoken = ''
  for (const part of parts) {
    const next = spoken ? `${spoken} ${part}` : part
    if (next.length > 220 && spoken) break
    spoken = next
    if (spoken.length >= 90) break
  }
  if (!spoken) spoken = plain.slice(0, 200)
  return { spoken, written: trimmed, hasExplicit: false }
}
