/** Conversation payment card for `x402_pay` calls: a pure projection of the logged call/result slice. */

import { useState, type ReactNode } from 'react'
import { DisclosureRow, IconCheckOutline16, IconCloseOutline16, StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { x402CallView, type X402CallView } from './card-model.ts'
import type { X402Key } from './locales.ts'
import css from './X402PaymentRow.module.css'

/** Full card props composed by the keyed Tool slot. */
export type X402PaymentRowProps = ToolCallViewProps & PropsLocale<'x402'>

const STATUS_LABELS: Record<Exclude<X402CallView['paymentStatus'], null>, X402Key> = {
  settled: 'history.settled',
  settle_failed: 'history.failed',
  payment_required: 'row.paymentRequired',
  none: 'row.free',
}

function leadingFor(view: X402CallView): ReactNode {
  if (view.isError) return <StateDot state="error" />
  if (view.paymentStatus === 'settled') return <IconCheckOutline16 />
  if (view.paymentStatus === 'settle_failed' || view.paymentStatus === 'payment_required') return <IconCloseOutline16 />
  return undefined
}

/** Render one `x402_pay` call as a payment card. */
export function X402PaymentRow({ block, t }: X402PaymentRowProps) {
  const [open, setOpen] = useState(false)
  const view = x402CallView(block)
  const statusLabel = view.paymentStatus === null ? null : STATUS_LABELS[view.paymentStatus]
  return (
    <DisclosureRow
      rowClassName={css.row}
      icon={leadingFor(view)}
      title={`${view.url ?? block.callId} · ${statusLabel !== null ? t(statusLabel) : t('row.awaiting')}`}
      open={open}
      expandable
      expandOnRowClick
      onToggle={() => { setOpen(value => !value) }}
    >
      <dl className={css.details}>
        {view.maxCostUsdc !== null && (
          <div className={css.field}><dt>cap</dt><dd>{view.maxCostUsdc} USDC</dd></div>
        )}
        {view.transaction !== null && (
          <div className={css.field}><dt>tx</dt><dd className={css.tx}>{view.transaction}</dd></div>
        )}
      </dl>
    </DisclosureRow>
  )
}
