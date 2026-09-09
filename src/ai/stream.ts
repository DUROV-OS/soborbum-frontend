import { StreamEvent } from '@/shared/lib/httpClient'

/** One assistant message being streamed. `done` flips on its `block_end`. */
export interface StreamBubble {
  id: string
  text: string
  done: boolean
}

export interface StreamView {
  bubbles: StreamBubble[]
  status: string | null
}

export const EMPTY_STREAM: StreamView = { bubbles: [], status: null }

/**
 * Fold one display-oriented SSE event (`block_start` / `text` / `block_end` /
 * `status`) into the live view. Control events (`done`, `pending_approval`,
 * `error`, `topic_reset`) are handled by the caller and pass through unchanged.
 */
export function applyStreamEvent(event: StreamEvent, view: StreamView): StreamView {
  switch (event.type) {
    case 'block_start':
      return { bubbles: [...view.bubbles, { id: `s${view.bubbles.length}`, text: '', done: false }], status: null }
    case 'text': {
      const bubbles = view.bubbles.length ? [...view.bubbles] : [{ id: 's0', text: '', done: false }]
      const last = bubbles[bubbles.length - 1]
      bubbles[bubbles.length - 1] = { ...last, text: last.text + String(event.text ?? '') }
      return { bubbles, status: null }
    }
    case 'block_end': {
      if (!view.bubbles.length) return view
      const bubbles = [...view.bubbles]
      bubbles[bubbles.length - 1] = { ...bubbles[bubbles.length - 1], done: true }
      return { bubbles, status: view.status }
    }
    case 'status':
      return { bubbles: view.bubbles, status: String(event.text ?? '') || null }
    default:
      return view
  }
}
