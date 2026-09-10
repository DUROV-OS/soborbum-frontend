/**
 * Сменный голос Марины в режиме «Совещание». Тот же движок синтеза, что в
 * разделе «Агенты» (shared/lib/speechReply → speakPrincess): нейросетевые
 * голоса Edge TTS через backend + системные голоса speechSynthesis.
 * Выбор запоминается в localStorage; по умолчанию — как в «Агентах».
 */
import { setPreferredVoice, VoicePreference } from '@/shared/lib/speechReply'

const STORAGE_KEY = 'meeting.voiceId'

export interface VoiceChoice {
  id: string
  label: string
  pref: VoicePreference
}

/** Нейросетевые голоса Edge TTS — имена должны совпадать с VOICES в app/ai/tts.py. */
export const NEURAL_VOICES: VoiceChoice[] = [
  { id: 'neural:svetlana', label: 'Светлана · нейро (по умолчанию)', pref: { neuralVoice: 'ru-RU-SvetlanaNeural' } },
  { id: 'neural:dariya', label: 'Дария · нейро', pref: { neuralVoice: 'ru-RU-DariyaNeural' } },
  { id: 'neural:dmitry', label: 'Дмитрий · нейро', pref: { neuralVoice: 'ru-RU-DmitryNeural' } },
]

export const DEFAULT_VOICE_ID = NEURAL_VOICES[0].id

function systemVoiceChoices(): VoiceChoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('ru') || /russian|русск/i.test(v.name))
    .map((v) => ({
      id: `sys:${v.voiceURI}`,
      label: `${v.name} · система`,
      pref: { systemVoiceURI: v.voiceURI },
    }))
}

export function listVoiceChoices(): VoiceChoice[] {
  return [...NEURAL_VOICES, ...systemVoiceChoices()]
}

export function loadVoiceId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_VOICE_ID
  } catch {
    return DEFAULT_VOICE_ID
  }
}

/** Применяет голос к движку синтеза и запоминает выбор. */
export function applyVoiceId(id: string): void {
  const choice = listVoiceChoices().find((c) => c.id === id) ?? NEURAL_VOICES[0]
  setPreferredVoice(choice.pref)
  try {
    localStorage.setItem(STORAGE_KEY, choice.id)
  } catch {
    /* приватный режим — просто не запомним */
  }
}

/** Вызвать один раз при старте, чтобы восстановить сохранённый голос. */
export function initVoiceFromStorage(): void {
  applyVoiceId(loadVoiceId())
}
