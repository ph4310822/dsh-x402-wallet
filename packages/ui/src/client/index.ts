/** x402 wallet surfaces, browser half: a sidebar entry opening a Phantom-style wallet popup, and the pay card. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { BakedActions } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-tool/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import { X402WalletEntry } from './X402WalletEntry.tsx'
import { X402PaymentRow } from './X402PaymentRow.tsx'
import { en, NS, zh } from './locales.ts'
import type { X402EntryFace, X402ModalFace } from './slots.ts'
import { createX402PanelStore } from './store.ts'
import type { X402PanelState, X402PanelActions } from './store.ts'

export type { X402EntryFace, X402ModalFace } from './slots.ts'
export type { X402WalletEntryProps } from './X402WalletEntry.tsx'
export type { X402WalletModalProps } from './X402WalletModal.tsx'
export type { X402PaymentRowProps } from './X402PaymentRow.tsx'
export type { X402CallView } from './card-model.ts'
export type { X402PanelState, X402PanelActions, X402PanelStore } from './store.ts'
export type { X402Key } from './locales.ts'

/** Required services: slot composition, locale dictionaries, the Host Remote carrier, and the x402 namespace. */
export const inject = ['slots', 'locale', 'remote', 'remote.x402']

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Mount the wallet entry/popup and the x402_pay card. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-x402: dictionaries')

  const store = createX402PanelStore()
  // The port lives inside the inject factory because that is where the
  // framework hands over the baked store actions bound to the one engine
  // instance the popup reads; apply-level code must not create its own.
  // The factory runs when the sidebar composes the entry, so the apply-level
  // event handlers reach it through this closure reference.
  let refreshRef: (() => Promise<void>) | undefined

  ctx.remote.$on('x402/payment', () => { if (refreshRef !== undefined) void refreshRef() })
  ctx.on('connection/reset', () => { if (refreshRef !== undefined) void refreshRef() })

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'x402-panel',
    locale: NS,
    store,
    inject: (actions: BakedActions<X402PanelState, X402PanelActions>): X402EntryFace & X402ModalFace => {
      const refresh = async (): Promise<void> => {
        actions.beginRefresh()
        try {
          const [walletAnswer, walletsAnswer, paymentsAnswer] = await Promise.all([
            ctx.remote.x402.wallet(),
            ctx.remote.x402.wallets(),
            ctx.remote.x402.payments(),
          ])
          if (!walletAnswer.ok) throw new Error(walletAnswer.error.message)
          if (!walletsAnswer.ok) throw new Error(walletsAnswer.error.message)
          if (!paymentsAnswer.ok) throw new Error(paymentsAnswer.error.message)
          // History legitimately refuses without a wallet; the popup's create
          // guidance owns that state, so the refusal becomes an empty list.
          const history = walletAnswer.value.configured
            ? await ctx.remote.x402.history(undefined)
            : { ok: true as const, value: [] }
          if (!history.ok) throw new Error(history.error.message)
          actions.applyWallet(walletAnswer.value)
          actions.applyWallets(walletsAnswer.value)
          actions.applyHistory(history.value)
          actions.applyPayments(paymentsAnswer.value)
          actions.applyError(null)
        } catch (error) {
          actions.applyError(errorMessage(error))
        } finally {
          actions.endRefresh()
        }
      }
      const createWallet = async (label: string, privateKey?: string): Promise<void> => {
        actions.patchCreateForm({ busy: true, error: null })
        try {
          const answer = await ctx.remote.x402.createWallet(
            privateKey === undefined ? { label } : { label, privateKey },
          )
          if (!answer.ok) throw new Error(answer.error.message)
          actions.resetCreateForm()
          actions.setView({ kind: 'main' })
          await refresh()
        } catch (error) {
          actions.patchCreateForm({ error: errorMessage(error) })
        } finally {
          actions.patchCreateForm({ busy: false })
        }
      }
      const selectWallet = async (id: string): Promise<void> => {
        try {
          const answer = await ctx.remote.x402.selectWallet(id)
          if (!answer.ok) throw new Error(answer.error.message)
          await refresh()
        } catch (error) {
          actions.applyError(errorMessage(error))
        }
      }
      const send = async (to: string, amountUsdc: string): Promise<void> => {
        actions.patchSendForm({ busy: true, error: null, done: null })
        try {
          const answer = await ctx.remote.x402.send({ to, amountUsdc })
          if (!answer.ok) throw new Error(answer.error.message)
          actions.patchSendForm({ done: answer.value })
          await refresh()
        } catch (error) {
          actions.patchSendForm({ error: errorMessage(error) })
        } finally {
          actions.patchSendForm({ busy: false })
        }
      }
      refreshRef = refresh
      return { open: () => { actions.setOpen(true) }, refresh, createWallet, selectWallet, send }
    },
  }, X402WalletEntry))

  ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
    name: 'tool.call.toolview',
    key: 'x402_pay',
    locale: NS,
  }, X402PaymentRow))
}
