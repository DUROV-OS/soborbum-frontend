/**
 * Free offline-capable STT fallback (Whisper tiny via CDN).
 * Used only when the browser has no SpeechRecognition (e.g. Firefox).
 * No paid API keys. First run downloads a small model (~75MB) into the browser cache.
 */

let pipelinePromise: Promise<(audio: Blob | string, options?: object) => Promise<{ text?: string }>> | null = null

async function getTranscriber() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const url = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm'
      const dynamicImport = new Function('u', 'return import(u)') as (u: string) => Promise<{
        pipeline: (
          task: string,
          model: string,
          options?: object,
        ) => Promise<(audio: Blob | string, options?: object) => Promise<{ text?: string }>>
        env: { allowLocalModels: boolean; useBrowserCache: boolean }
      }>
      const { pipeline, env } = await dynamicImport(url)
      env.allowLocalModels = false
      env.useBrowserCache = true
      return pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
        quantized: true,
      })
    })()
  }
  return pipelinePromise
}

export async function transcribeWithWhisper(blob: Blob): Promise<string> {
  const transcriber = await getTranscriber()
  const url = URL.createObjectURL(blob)
  try {
    const result = await transcriber(url, {
      language: 'russian',
      task: 'transcribe',
    })
    return (result?.text ?? '').trim()
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

export function mediaRecorderAvailable(): boolean {
  return typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== 'undefined'
    && pickRecorderMimeType() !== undefined
}
