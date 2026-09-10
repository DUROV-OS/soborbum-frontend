/**
 * Короткие звуковые сигналы Марины в режиме «Совещание» — генерируются
 * WebAudio-осциллятором, без файлов. Не трогают speakPrincess/currentAudio.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, startOffset: number, durationMs: number) {
  const ac = getCtx()
  if (!ac) return
  const t0 = ac.currentTime + startOffset
  const dur = durationMs / 1000
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.03)
}

/** Услышала имя — восходящий сигнал. */
export function chimeListening() {
  tone(880, 0, 120)
  tone(1245, 0.13, 150)
}

/** Закончила думать — нисходящий сигнал. */
export function chimeReady() {
  tone(1245, 0, 120)
  tone(784, 0.13, 170)
}
