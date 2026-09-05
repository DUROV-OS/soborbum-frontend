import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Chip, ChipTone } from '@/shared/ui/Chip'
import { Drawer } from '@/shared/ui/Drawer'
import { Field, Textarea } from '@/shared/ui/Field'
import { LoadingState } from '@/shared/ui/LoadingState'
import { findNode } from '../lib/tree'
import { useBoardStore } from '../store'
import { BoardNodeChange, CouncilStance, ProposalRound } from '../types'
import { STATUS_LABEL } from './NodePopover'

const STANCE_LABEL: Record<CouncilStance, string> = {
  support: 'За',
  caution: 'С оговорками',
  oppose: 'Против',
}

const STANCE_TONE: Record<CouncilStance, ChipTone> = {
  support: 'success',
  caution: 'warning',
  oppose: 'danger',
}

/** Короткая тезисная выжимка того, что поменялось в описании ноды — первое предложение
 * нового описания, без полного текста (полный текст виден в самом дереве). */
function shortSummary(change: BoardNodeChange): string {
  if (change.change_type === 'deleted') return 'Нода удалена.'

  const text = change.new_description?.trim()
  if (!text) return change.change_type === 'created' ? 'Добавлена новая нода.' : 'Обновлено.'

  const firstSentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0].trim() ?? text
  const summary = firstSentence.length > 160 ? `${firstSentence.slice(0, 157).trimEnd()}…` : firstSentence

  return change.change_type === 'created' ? `Добавлена: ${summary}` : summary
}

function RoundCard({ round, index }: { round: ProposalRound; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-[12px] text-muted">
        Раунд {index + 1}
        {round.decision === 'rejected' && ' — отклонён сотрудником'}
        {round.decision === 'accepted' && ' — принято'}
      </div>
      <p className="mt-1 text-[13px] text-ink">{round.summary}</p>

      {round.recommendation === 'change' ? (
        <div className="mt-2 rounded-md bg-success-bg p-2.5 text-[12px] text-success">
          Совет за изменение{round.proposed_color && ` — статус: «${STATUS_LABEL[round.proposed_color]}»`}.
          {round.proposed_description && <p className="mt-1 text-ink">{round.proposed_description}</p>}
        </div>
      ) : (
        <div className="mt-2 rounded-md bg-surface-muted p-2.5 text-[12px] text-muted">
          Совет считает, что менять ничего не нужно.
        </div>
      )}

      <button
        type="button"
        className="mt-2 text-[12px] font-medium text-brand hover:text-brand-dark"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Скрыть обсуждение совета' : 'Показать обсуждение совета'}
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2">
          {round.council.map((op) => (
            <div key={op.role} className="rounded-md bg-surface-muted p-2.5">
              <div className="flex items-center justify-between gap-2 text-[12px] font-medium text-ink">
                <span>{op.role_label}</span>
                <Chip tone={STANCE_TONE[op.stance]}>{STANCE_LABEL[op.stance]}</Chip>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{op.opinion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ProposalPanel() {
  const nodeId = useBoardStore((s) => s.proposalNodeId)
  const proposal = useBoardStore((s) => s.proposal)
  const loading = useBoardStore((s) => s.proposalLoading)
  const error = useBoardStore((s) => s.proposalError)
  const appliedChanges = useBoardStore((s) => s.appliedChanges)
  const animating = useBoardStore((s) => s.animating)
  const tree = useBoardStore((s) => s.tree)
  const sendMessage = useBoardStore((s) => s.sendMessage)
  const reject = useBoardStore((s) => s.reject)
  const accept = useBoardStore((s) => s.accept)
  const closeProposal = useBoardStore((s) => s.closeProposal)

  const [message, setMessage] = useState('')
  const [comment, setComment] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [pendingLabel, setPendingLabel] = useState('Совет обсуждает предложение…')

  useEffect(() => {
    setMessage('')
    setComment('')
    setShowReject(false)
  }, [nodeId])

  if (nodeId === null) return null

  const node = tree ? findNode(tree, nodeId) : null
  const rounds = proposal?.rounds ?? []
  const latestRound = rounds.length ? rounds[rounds.length - 1] : null
  const historyRounds = rounds.slice(0, -1)

  async function handleSend() {
    if (!message.trim()) return
    setPendingLabel('Совет собирается и обсуждает предложение…')
    await sendMessage(message.trim())
  }

  async function handleReject() {
    if (!comment.trim()) return
    setPendingLabel('Совет пересматривает решение с учётом комментария…')
    await reject(comment.trim())
    setComment('')
    setShowReject(false)
  }

  async function handleAccept() {
    setPendingLabel('Совет вносит изменения по дереву…')
    await accept()
  }

  return (
    <Drawer open title="Внести изменения" subtitle={node?.title} onClose={closeProposal}>
      <div className="flex flex-col gap-4">
        {historyRounds.map((round, i) => (
          <RoundCard key={i} round={round} index={i} />
        ))}

        {latestRound && <RoundCard round={latestRound} index={rounds.length - 1} />}

        {error && <p className="text-[13px] text-danger">{error}</p>}

        {loading && <LoadingState label={pendingLabel} />}

        {!loading && !proposal && (
          <Field
            label="Что обсудить с советом?"
            hint="Опишите изменение или вопрос, который стоит вынести на обсуждение совета директоров."
          >
            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Например: не пора ли переориентировать бюджет розыгрышей на выставки и мероприятия?"
            />
          </Field>
        )}

        {!loading && !proposal && (
          <Button onClick={handleSend} disabled={!message.trim()}>
            Собрать совет
          </Button>
        )}

        {!loading && latestRound && latestRound.decision === 'pending' && !showReject && (
          <div className="flex gap-2">
            {latestRound.recommendation === 'change' && <Button onClick={handleAccept}>Согласиться</Button>}
            <Button variant="secondary" onClick={() => setShowReject(true)}>
              Не согласен
            </Button>
          </div>
        )}

        {!loading && latestRound && latestRound.decision === 'pending' && showReject && (
          <div className="flex flex-col gap-2">
            <Field label="Почему не согласны?" required>
              <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button onClick={handleReject} disabled={!comment.trim()}>
                Отправить на пересмотр
              </Button>
              <Button variant="ghost" onClick={() => setShowReject(false)}>
                Отмена
              </Button>
            </div>
          </div>
        )}

        {appliedChanges && animating && (
          <LoadingState label="ИИ применяет изменения по дереву — следите за подсветкой на схеме…" />
        )}

        {appliedChanges && !animating && (
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-surface-muted">
                    <th className="px-3 py-2 font-medium text-muted">Нода</th>
                    <th className="px-3 py-2 font-medium text-muted">Что изменилось</th>
                  </tr>
                </thead>
                <tbody>
                  {appliedChanges.map((change) => (
                    <tr key={change.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 align-top font-medium text-ink">{change.title}</td>
                      <td className="px-3 py-2 align-top text-muted">{shortSummary(change)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="secondary" onClick={closeProposal}>
              Закрыть
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  )
}
