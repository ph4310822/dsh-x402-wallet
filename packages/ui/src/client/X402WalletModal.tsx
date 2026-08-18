/** Phantom-style wallet popup: balance hero, send/receive, activity, and the wallet switcher. */

import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import QRCode from 'react-qr-code'
import {
  IconCheckOutline16, IconChevronDownOutline14, IconCloseOutline16, IconCopyOutline16,
  IconPlusOutline16, IconRefreshOutline16, IconSendOutline16, Modal, writeClipboard,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { X402HistoryEntry, X402PaymentRecord, X402WalletRecord, X402WalletState } from '@danielng23/dsh-x402/types'
import { explorerTxUrl, faucetUrl } from './explorer.ts'
import type { X402CreateForm, X402SendForm, X402WalletView } from './store.ts'
import type { X402ModalFace } from './slots.ts'
import type { X402WalletEntryProps } from './X402WalletEntry.tsx'
import css from './X402WalletModal.module.css'

/** Modal props: the store share, the modal face, and the locale seat. */
export type X402WalletModalProps = {
  useStore: X402WalletEntryProps['useStore']
  actions: X402WalletEntryProps['actions']
  face: X402ModalFace
  t: X402WalletEntryProps['t']
}

/** Truncate an address to a displayable short form. */
export function shortAddress(address: string): string {
  return address.length <= 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** Wrap children in a block-explorer link when the network is known. */
function TxLink({ network, hash, children }: {
  network: string
  hash: string
  children: ReactNode
}) {
  const url = explorerTxUrl(network, hash)
  if (url === undefined) return <>{children}</>
  return (
    <a className={css.txLink} href={url} target="_blank" rel="noreferrer" title={hash}>
      {children}
    </a>
  )
}

/** How long the transient copy label stays visible, in ms. */
const COPIED_MS = 1000

/** Receive-screen balance polling interval, in ms. */
const RECEIVE_POLL_MS = 5000

/** Render the balance hero and the send/receive actions. */
function MainView({ wallet, history, payments, t, onSend, onReceive, onCreate }: {
  wallet: X402WalletState | null
  history: X402HistoryEntry[]
  payments: X402PaymentRecord[]
  t: X402WalletEntryProps['t']
  onSend: () => void
  onReceive: () => void
  onCreate: () => void
}) {
  if (wallet === null) return <div className={css.center}>{t('main.loading')}</div>
  if (!wallet.configured) {
    return (
      <div className={css.empty}>
        <div className={css.emptyTitle}>{t('main.empty')}</div>
        <div className={css.emptyHint}>{t('main.emptyHint')}</div>
        <button type="button" className={css.primary} onClick={onCreate}>{t('main.create')}</button>
      </div>
    )
  }
  return (
    <div className={css.main}>
      <div className={css.hero}>
        <div className={css.heroLabel}>{t('main.balance')}</div>
        <div className={css.heroAmount}>{wallet.usdcBalance ?? '--'}</div>
        <div className={css.heroUnit}>USDC</div>
      </div>
      <div className={css.actions}>
        <button type="button" className={css.action} onClick={onSend}><IconSendOutline16 />{t('main.send')}</button>
        <button type="button" className={css.action} onClick={onReceive}><IconPlusOutline16 />{t('main.receive')}</button>
      </div>
      <div className={css.sectionTitle}>{t('main.assets')}</div>
      <div className={css.tokenRow}>
        <span className={css.tokenBadge}>$</span>
        <span className={css.tokenName}>USDC</span>
        <span className={css.tokenAmount}>{wallet.usdcBalance ?? '--'}</span>
      </div>
      <div className={css.sectionTitle}>{t('main.activity')}</div>
      {history.length === 0 && <div className={css.center}>{t('main.activityEmpty')}</div>}
      <ul className={css.activity}>
        {history.map(entry => (
          <li key={entry.hash} className={css.activityRow}>
            <span className={entry.direction === 'out' ? css.amountOut : css.amountIn}>
              {entry.direction === 'out' ? '−' : '+'}{entry.amountUsdc}
            </span>
            <span className={css.activityMeta}>
              {entry.direction === 'out' ? t('main.send') : t('main.receive')} · {shortAddress(entry.direction === 'out' ? entry.to : entry.from)}
            </span>
            <TxLink network={wallet.network} hash={entry.hash}>
              <span className={css.activityBlock}>#{entry.blockNumber}</span>
            </TxLink>
          </li>
        ))}
      </ul>
      <div className={css.sectionTitle}>{t('main.payments')}</div>
      {payments.length === 0 && <div className={css.center}>{t('main.paymentsEmpty')}</div>}
      <ul className={css.activity}>
        {payments.slice(0, 6).map(payment => (
          <li key={payment.id} className={css.activityRow}>
            <span className={payment.status === 'settled' ? css.amountOut : css.amountIn}>−{payment.amountUsdc}</span>
            <span className={css.activityMeta}>
              {payment.status === 'settled' ? t('history.settled') : t('history.failed')} · {payment.url}
            </span>
            <span className={css.activityBlock}>{payment.network}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Render the receive view: full address, QR code, and copy. */
function ReceiveView({ wallet, t }: { wallet: X402WalletState | null; t: X402WalletEntryProps['t'] }) {
  const [copied, setCopied] = useState(false)
  const address = wallet?.configured === true ? (wallet.address ?? '') : ''
  const network = wallet?.network ?? ''
  const faucet = faucetUrl(network)
  const copy = (): void => {
    void writeClipboard(address).then((ok) => {
      if (!ok || copied) return
      setCopied(true)
      window.setTimeout(() => { setCopied(false) }, COPIED_MS)
    })
  }
  return (
    <div className={css.receive}>
      <div className={css.qrWrap} aria-label={t('receive.qr')}><QRCode value={address || ' '} size={148} /></div>
      <div className={css.addressLabel}>{t('receive.address')}</div>
      <code className={css.address}>{address}</code>
      <button type="button" className={css.primary} aria-label={t('receive.copy')} onClick={copy}>
        {copied
          ? <span className={css.copyOk}><IconCheckOutline16 />{t('receive.copied')}</span>
          : <><IconCopyOutline16 />{t('receive.copy')}</>}
      </button>
      <div className={css.hint}>{t('receive.hint', { network })}</div>
      {faucet !== undefined && (
        <a className={css.faucet} href={faucet} target="_blank" rel="noreferrer">{t('receive.faucet')}</a>
      )}
    </div>
  )
}

/** Render the send view: recipient + amount, then the confirmed receipt. */
function SendView({ form, t, face, actions, network }: {
  form: X402SendForm
  t: X402WalletEntryProps['t']
  face: X402ModalFace
  actions: X402WalletEntryProps['actions']
  network: string
}) {
  const submit = (event: FormEvent): void => {
    event.preventDefault()
    if (form.busy) return
    if (!/^0x[0-9a-fA-F]{40}$/.test(form.to.trim()) || !(Number(form.amount) > 0)) {
      actions.patchSendForm({ error: t('send.invalid') })
      return
    }
    actions.patchSendForm({ error: null })
    void face.send(form.to.trim(), form.amount.trim())
  }
  if (form.done !== null) {
    return (
      <div className={css.receipt}>
        <span className={css.receiptIcon}><IconCheckOutline16 /></span>
        <div className={css.receiptTitle}>{t('send.confirmed')}</div>
        <div className={css.receiptMeta}>{t('send.transaction')}</div>
        <TxLink network={network} hash={form.done.transaction}>
          <code className={css.tx}>{form.done.transaction}</code>
        </TxLink>
        <div className={css.receiptMeta}>{form.done.amountUsdc} USDC → {shortAddress(form.done.to)}</div>
        <button
          type="button"
          className={css.primary}
          onClick={() => { actions.resetSendForm(); actions.setView({ kind: 'main' }) }}
        >
          {t('send.done')}
        </button>
      </div>
    )
  }
  return (
    <form className={css.form} onSubmit={submit}>
      <label className={css.field}>
        <span className={css.fieldLabel}>{t('send.to')}</span>
        <input
          className={css.input}
          value={form.to}
          placeholder={t('send.toPlaceholder')}
          onChange={(event) => { actions.patchSendForm({ to: event.target.value }) }}
        />
      </label>
      <label className={css.field}>
        <span className={css.fieldLabel}>{t('send.amount')}</span>
        <input
          className={css.input}
          type="number"
          min="0"
          step="any"
          value={form.amount}
          placeholder={t('send.amountPlaceholder')}
          onChange={(event) => { actions.patchSendForm({ amount: event.target.value }) }}
        />
      </label>
      {form.error !== null && <div className={css.error}>{form.error}</div>}
      <button type="submit" className={css.primary} disabled={form.busy}>
        {form.busy ? t('send.busy') : t('send.submit')}
      </button>
    </form>
  )
}

/** Render the create/import view: label plus generate or imported key. */
function CreateView({ form, t, face, actions }: {
  form: X402CreateForm
  t: X402WalletEntryProps['t']
  face: X402ModalFace
  actions: X402WalletEntryProps['actions']
}) {
  const submit = (event: FormEvent): void => {
    event.preventDefault()
    if (form.busy) return
    const key = form.privateKey.trim()
    const mnemonic = form.mnemonic.trim()
    void face.createWallet(
      form.label.trim(),
      form.mode === 'key' && key !== '' ? key : undefined,
      form.mode === 'mnemonic' && mnemonic !== '' ? mnemonic : undefined,
    )
  }
  return (
    <form className={css.form} onSubmit={submit}>
      <label className={css.field}>
        <span className={css.fieldLabel}>{t('create.label')}</span>
        <input
          className={css.input}
          value={form.label}
          placeholder={t('create.labelPlaceholder')}
          onChange={(event) => { actions.patchCreateForm({ label: event.target.value }) }}
        />
      </label>
      <div className={css.segmented}>
        <button
          type="button"
          className={form.mode === 'generate' ? css.segmentActive : css.segment}
          onClick={() => { actions.patchCreateForm({ mode: 'generate' }) }}
        >
          {t('create.generate')}
        </button>
        <button
          type="button"
          className={form.mode === 'key' ? css.segmentActive : css.segment}
          onClick={() => { actions.patchCreateForm({ mode: 'key' }) }}
        >
          {t('create.import')}
        </button>
        <button
          type="button"
          className={form.mode === 'mnemonic' ? css.segmentActive : css.segment}
          onClick={() => { actions.patchCreateForm({ mode: 'mnemonic' }) }}
        >
          {t('create.mnemonic')}
        </button>
      </div>
      {form.mode === 'key' && (
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('create.privateKey')}</span>
          <textarea
            className={css.textarea}
            value={form.privateKey}
            placeholder={t('create.privateKeyPlaceholder')}
            onChange={(event) => { actions.patchCreateForm({ privateKey: event.target.value }) }}
          />
        </label>
      )}
      {form.mode === 'mnemonic' && (
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('create.mnemonic')}</span>
          <textarea
            className={css.textarea}
            value={form.mnemonic}
            placeholder={t('create.mnemonicPlaceholder')}
            onChange={(event) => { actions.patchCreateForm({ mnemonic: event.target.value }) }}
          />
        </label>
      )}
      {(form.mode === 'key' || form.mode === 'mnemonic') && <div className={css.hint}>{t('create.importHint')}</div>}
      {form.error !== null && <div className={css.error}>{form.error}</div>}
      <button type="submit" className={css.primary} disabled={form.busy}>
        {form.busy ? t('create.busy') : t('create.submit')}
      </button>
    </form>
  )
}

/** Render the wallet switcher list, one row per registered wallet. */
function WalletList({ wallets, t, onPick, onNew }: {
  wallets: X402WalletRecord[]
  t: X402WalletEntryProps['t']
  onPick: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className={css.switcher}>
      <div className={css.switcherTitle}>{t('switch.title')}</div>
      <ul className={css.switcherList}>
        {wallets.map(wallet => (
          <li key={wallet.id}>
            <button type="button" className={css.walletRow} onClick={() => { onPick(wallet.id) }}>
              <span className={css.walletMeta}>
                <span className={css.walletLabel}>{wallet.label}</span>
                <span className={css.walletAddress}>{shortAddress(wallet.address)}</span>
              </span>
              {wallet.isCurrent && <span className={css.currentBadge}>{t('switch.current')}</span>}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={css.newWallet} onClick={onNew}>
        <IconPlusOutline16 />{t('switch.new')}
      </button>
    </div>
  )
}

/** Render the Phantom-style wallet popup with the four modal screens. */
export function X402WalletModal({ useStore, actions, face, t }: X402WalletModalProps) {
  const state = useStore(snapshot => snapshot)
  const [switcher, setSwitcher] = useState(false)
  const close = (): void => { actions.setOpen(false) }
  const goMain = (): void => { actions.setView({ kind: 'main' }); setSwitcher(false) }
  const view: X402WalletView = state.view

  // While the receive screen is open, poll so funds landing on-chain show up
  // without a manual refresh.
  useEffect(() => {
    if (!state.open || view.kind !== 'receive') return
    const timer = window.setInterval(() => { void face.refresh() }, RECEIVE_POLL_MS)
    return () => { window.clearInterval(timer) }
  }, [state.open, view.kind, face])

  return (
    <Modal open={state.open} onClose={close} title={t('modal.title')} closeLabel={t('modal.close')} headless className={css.dialog as string}>
      <div className={css.shell}>
        <header className={css.header}>
          {view.kind === 'main'
            ? (
              <button type="button" className={css.walletButton} onClick={() => { setSwitcher(value => !value) }} aria-expanded={switcher}>
                <span className={css.headerName}>
                  {state.wallet?.configured === true
                    ? (state.wallet.label ?? shortAddress(state.wallet.address ?? ''))
                    : t('main.empty')}
                </span>
                <span className={css.headerNetwork}>
                  {state.wallet?.network ?? ''}<IconChevronDownOutline14 />
                </span>
              </button>
            )
            : <button type="button" className={css.back} onClick={goMain}>{t('common.back')}</button>}
          <span className={css.headerTools}>
            <button type="button" className={css.close} aria-label={t('action.refresh')} onClick={() => { void face.refresh() }}>
              <IconRefreshOutline16 />
            </button>
            <button type="button" className={css.close} aria-label={t('modal.close')} onClick={close}>
              <IconCloseOutline16 />
            </button>
          </span>
        </header>
        {state.error !== null && <div className={css.error}>{t('modal.error', { message: state.error })}</div>}
        {switcher && view.kind === 'main' && (
          <WalletList
            wallets={state.wallets}
            t={t}
            onPick={(id) => {
              setSwitcher(false)
              void face.selectWallet(id)
            }}
            onNew={() => { setSwitcher(false); actions.setView({ kind: 'create' }) }}
          />
        )}
        {view.kind === 'main' && (
          <MainView
            wallet={state.wallet}
            history={state.history}
            payments={state.payments}
            t={t}
            onSend={() => { actions.setView({ kind: 'send' }) }}
            onReceive={() => { actions.setView({ kind: 'receive' }) }}
            onCreate={() => { actions.setView({ kind: 'create' }) }}
          />
        )}
        {view.kind === 'receive' && <ReceiveView wallet={state.wallet} t={t} />}
        {view.kind === 'send' && <SendView form={state.sendForm} t={t} face={face} actions={actions} network={state.wallet?.network ?? ''} />}
        {view.kind === 'create' && <CreateView form={state.createForm} t={t} face={face} actions={actions} />}
      </div>
    </Modal>
  )
}
