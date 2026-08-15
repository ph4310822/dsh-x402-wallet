// @vitest-environment jsdom
/**
 * Wallet panel and pay-card component specs: realistic props drive visible
 * states — configured wallet, unconfigured wallet, error, history rows, and
 * the payment card's status line.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-web-react'
import type { ToolCallBlock } from '@deepseek-ai/dsh-client-runtime/client'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import type { X402PaymentRecord, X402WalletState } from '@danielng23/dsh-x402/types'
import { X402Panel } from '../src/client/X402Panel.tsx'
import type { X402PanelProps } from '../src/client/X402Panel.tsx'
import { X402PaymentRow } from '../src/client/X402PaymentRow.tsx'
import type { X402PaymentRowProps } from '../src/client/X402PaymentRow.tsx'
import { createX402PanelStore } from '../src/client/store.ts'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate(zh, commonZh) as never

/** Panel props with the framework seats stubbed; the store instance drives state. */
function panelProps(instance: ReturnType<ReturnType<typeof createX402PanelStore>['create']>) {
  return {
    wide: false,
    useStore: bindSnapshotSelector(instance),
    actions: instance.actions,
    useSessions: () => [],
    useWorkspaces: () => [],
    refresh: () => Promise.resolve(),
    t,
  } as unknown as X402PanelProps
}

function walletState(overrides: Partial<X402WalletState> = {}): X402WalletState {
  return {
    configured: true,
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    usdcBalance: '1.250000',
    network: 'eip155:8453',
    ...overrides,
  }
}

function paymentRecord(overrides: Partial<X402PaymentRecord> = {}): X402PaymentRecord {
  return {
    id: 'x402-1',
    url: 'https://api.example.test/data',
    amountUsdc: '0.001000',
    network: 'eip155:8453',
    transaction: '0xabc',
    status: 'settled',
    time: 0,
    ...overrides,
  }
}

describe('X402Panel', () => {
  it('renders the configured wallet address and balance', () => {
    const store = createX402PanelStore()
    const instance = store.create()
    instance.actions.applyWallet(walletState())
    const { getByText } = render(<X402Panel {...panelProps(instance)} />)
    expect(getByText(/0xf39F…2266/)).toBeDefined()
    expect(getByText(/1\.250000 USDC/)).toBeDefined()
    expect(getByText(/eip155:8453/)).toBeDefined()
  })

  it('renders the unconfigured hint', () => {
    const store = createX402PanelStore()
    const instance = store.create()
    instance.actions.applyWallet(walletState({ configured: false }))
    const { getByText } = render(<X402Panel {...panelProps(instance)} />)
    expect(getByText('未配置钱包')).toBeDefined()
  })

  it('renders payment history rows', () => {
    const store = createX402PanelStore()
    const instance = store.create()
    instance.actions.applyWallet(walletState())
    instance.actions.applyPayments([paymentRecord(), paymentRecord({ id: 'x402-2', status: 'failed' })])
    const { getAllByText } = render(<X402Panel {...panelProps(instance)} />)
    expect(getAllByText(/0\.001000 USDC/)).toHaveLength(2)
    expect(getAllByText(/https:\/\/api\.example\.test\/data/)).toHaveLength(2)
  })

  it('renders a short address verbatim', () => {
    const store = createX402PanelStore()
    const instance = store.create()
    instance.actions.applyWallet({ configured: true, address: '0xabc', network: 'eip155:8453' })
    const { getByText } = render(<X402Panel {...panelProps(instance)} />)
    expect(getByText('0xabc')).toBeDefined()
  })

  it('omits the address field when configured without one', () => {
    const store = createX402PanelStore()
    const instance = store.create()
    instance.actions.applyWallet({ configured: true, usdcBalance: '1.000000', network: 'eip155:8453' })
    const { queryByText } = render(<X402Panel {...panelProps(instance)} />)
    expect(queryByText('1.000000 USDC')).toBeDefined()
  })

  it('shows the loading state before the first wallet read', () => {
    const store = createX402PanelStore()
    const instance = store.create()
    const { getByText } = render(<X402Panel {...panelProps(instance)} />)
    expect(getByText('读取中…')).toBeDefined()
  })

  it('refreshes from the header button and copies the address', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    const store = createX402PanelStore()
    const instance = store.create()
    instance.actions.applyWallet(walletState())
    const refresh = vi.fn(() => Promise.resolve())
    const { getByLabelText, getByText, queryByText } = render(<X402Panel {...panelProps(instance)} refresh={refresh} />)
    const button = getByLabelText('刷新')
    button.click()
    expect(refresh).toHaveBeenCalled()
    const copy = getByText(/0xf39F…2266/).parentElement?.parentElement?.querySelector('button')
    copy?.click()
    await waitFor(() => { expect(getByText('已复制')).toBeDefined() })
    await new Promise(resolve => setTimeout(resolve, 1100))
    expect(queryByText('已复制')).toBeNull()
  })

  it('renders a refresh error', () => {
    const store = createX402PanelStore()
    const instance = store.create()
    instance.actions.applyError('RPC unreachable')
    const { getByText } = render(<X402Panel {...panelProps(instance)} />)
    expect(getByText(/RPC unreachable/)).toBeDefined()
  })

  it('keeps the copy label unset when the clipboard refuses', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    })
    const store = createX402PanelStore()
    const instance = store.create()
    instance.actions.applyWallet(walletState())
    const { getByText, queryByText } = render(<X402Panel {...panelProps(instance)} />)
    const copy = getByText(/0xf39F…2266/).parentElement?.parentElement?.querySelector('button')
    copy?.click()
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(queryByText('已复制')).toBeNull()
  })

  it('renders a failed payment row with the failure label', () => {
    const store = createX402PanelStore()
    const instance = store.create()
    instance.actions.applyWallet(walletState())
    instance.actions.applyPayments([paymentRecord({ status: 'failed' })])
    const { getByText } = render(<X402Panel {...panelProps(instance)} />)
    expect(getByText('失败')).toBeDefined()
  })
})

describe('X402PaymentRow', () => {
  it('renders a settled payment with its transaction', () => {
    const block = {
      kind: 'tool-result',
      seq: 1,
      time: 0,
      callId: 'call-1',
      call: { name: 'x402_pay', argsRaw: JSON.stringify({ url: 'https://paid.test', maxCostUsdc: 0.5 }) },
      callTime: 0,
      content: [{ type: 'text', text: 'paymentStatus: settled\nhttp: 200\ntransaction: 0xabc' }],
      isError: false,
    } as unknown as ToolCallBlock
    const { getByText } = render(<X402PaymentRow {...({ block, callId: 'call-1', toolName: 'x402_pay', openFile: () => {}, t } as unknown as X402PaymentRowProps)} />)
    expect(getByText(/https:\/\/paid\.test/)).toBeDefined()
    expect(getByText(/已支付/)).toBeDefined()
    fireEvent.click(getByText(/https:\/\/paid\.test/))
    expect(getByText('0xabc')).toBeDefined()
  })

  it('renders a running call as awaiting payment', () => {
    const block = {
      callId: 'call-2',
      name: 'x402_pay',
      argsRaw: JSON.stringify({ url: 'https://paid.test' }),
      turn: 1,
      step: 1,
      time: 0,
      callView: null,
      subCalls: [],
    } as unknown as ToolCallBlock
    const { getByText } = render(<X402PaymentRow {...({ block, callId: 'call-2', toolName: 'x402_pay', openFile: () => {}, t } as unknown as X402PaymentRowProps)} />)
    expect(getByText(/支付中…/)).toBeDefined()
  })

  it('renders a failed settle with the failure label', () => {
    const block = {
      kind: 'tool-result',
      seq: 4,
      time: 0,
      callId: 'call-4',
      call: { name: 'x402_pay', argsRaw: JSON.stringify({ url: 'https://paid.test' }) },
      callTime: 0,
      content: [{ type: 'text', text: 'paymentStatus: settle_failed\nhttp: 200' }],
      isError: false,
    } as unknown as ToolCallBlock
    const { getByText } = render(<X402PaymentRow {...({ block, callId: 'call-4', toolName: 'x402_pay', openFile: () => {}, t } as unknown as X402PaymentRowProps)} />)
    expect(getByText(/失败/)).toBeDefined()
  })

  it('renders a payment-still-required status', () => {
    const block = {
      kind: 'tool-result',
      seq: 6,
      time: 0,
      callId: 'call-6',
      call: { name: 'x402_pay', argsRaw: JSON.stringify({ url: 'https://paid.test', maxCostUsdc: 0.5 }) },
      callTime: 0,
      content: [{ type: 'text', text: 'paymentStatus: payment_required\nhttp: 402' }],
      isError: false,
    } as unknown as ToolCallBlock
    const { getByText } = render(<X402PaymentRow {...({ block, callId: 'call-6', toolName: 'x402_pay', openFile: () => {}, t } as unknown as X402PaymentRowProps)} />)
    expect(getByText(/仍需支付/)).toBeDefined()
    fireEvent.click(getByText(/https:\/\/paid\.test/))
    expect(getByText('0.5 USDC')).toBeDefined()
  })

  it('falls back to the call id when the arguments are unreadable', () => {
    const block = {
      callId: 'call-7',
      name: 'x402_pay',
      argsRaw: 'not json',
      turn: 1,
      step: 1,
      time: 0,
      callView: null,
      subCalls: [],
    } as unknown as ToolCallBlock
    const { getByText } = render(<X402PaymentRow {...({ block, callId: 'call-7', toolName: 'x402_pay', openFile: () => {}, t } as unknown as X402PaymentRowProps)} />)
    expect(getByText(/call-7/)).toBeDefined()
  })

  it('renders an error result with the error dot', () => {
    const block = {
      kind: 'tool-result',
      seq: 5,
      time: 0,
      callId: 'call-5',
      call: { name: 'x402_pay', argsRaw: JSON.stringify({ url: 'https://paid.test' }) },
      callTime: 0,
      content: [{ type: 'text', text: 'boom' }],
      isError: true,
    } as unknown as ToolCallBlock
    const { getByText } = render(<X402PaymentRow {...({ block, callId: 'call-5', toolName: 'x402_pay', openFile: () => {}, t } as unknown as X402PaymentRowProps)} />)
    expect(getByText(/支付中…/)).toBeDefined()
  })

  it('renders a free call without a transaction', () => {
    const block = {
      kind: 'tool-result',
      seq: 2,
      time: 0,
      callId: 'call-3',
      call: { name: 'x402_pay', argsRaw: JSON.stringify({ url: 'https://free.test' }) },
      callTime: 0,
      content: [{ type: 'text', text: 'paymentStatus: none\nhttp: 200\n\n{"status":200}' }],
      isError: false,
    } as unknown as ToolCallBlock
    const { getByText, queryByText } = render(<X402PaymentRow {...({ block, callId: 'call-3', toolName: 'x402_pay', openFile: () => {}, t } as unknown as X402PaymentRowProps)} />)
    expect(getByText(/免费调用/)).toBeDefined()
    expect(queryByText('0xabc')).toBeNull()
  })
})

describe('X402Panel store', () => {
  it('mutates through the baked actions', () => {
    const store = createX402PanelStore()
    const instance = store.create()
    instance.actions.applyWallet(walletState())
    instance.actions.applyPayments([paymentRecord()])
    expect(instance.getSnapshot().wallet?.configured).toBe(true)
    expect(instance.getSnapshot().payments).toHaveLength(1)
  })
})
