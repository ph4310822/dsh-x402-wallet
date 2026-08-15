/** Sidebar entry that opens the Phantom-style x402 wallet popup. */

import { useEffect } from 'react'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { X402EntryFace, X402ModalFace } from './slots.ts'
import { createX402PanelStore } from './store.ts'
import { X402WalletModal } from './X402WalletModal.tsx'
import css from './X402WalletEntry.module.css'

/** Full entry props composed by the sidebar footer-action slot. */
export type X402WalletEntryProps =
  PropsRuntime<'sidebar.footer.action'>
  & PropsStore<ReturnType<typeof createX402PanelStore>>
  & InjectFace<X402EntryFace & X402ModalFace>
  & PropsLocale<'x402'>

/**
 * Sidebar entry button plus the wallet popup it opens. The modal is rendered
 * directly here: the primitives Modal portals to the document body, so no
 * separate slot surface is needed. `open` and `refresh` come from the inject
 * face (open is a verb, distinct from the store's `open` boolean, which lives
 * inside the snapshot).
 */
export function X402WalletEntry({ useStore, actions, open, refresh, createWallet, selectWallet, send, t }: X402WalletEntryProps) {
  const state = useStore(snapshot => snapshot)

  useEffect(() => {
    void refresh()
  }, [refresh])

  const hasWallet = state.wallet?.configured === true
  return (
    <>
      <Tooltip label={hasWallet ? t('panel.title') : t('entry.unconfigured')}>
        <button
          type="button"
          className={css.entry}
          aria-label={t('a11y.wallet')}
          data-unconfigured={hasWallet ? undefined : true}
          onClick={() => { open() }}
        >
          <span className={css.entryMark}>$</span>
          <span className={css.entryLabel}>{t('panel.title')}</span>
        </button>
      </Tooltip>
      <X402WalletModal
        useStore={useStore}
        actions={actions}
        face={{ refresh, createWallet, selectWallet, send }}
        t={t}
      />
    </>
  )
}
