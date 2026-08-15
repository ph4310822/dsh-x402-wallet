// @vitest-environment jsdom
/**
 * ui-x402 browser half on a real cordis Context with fake slots/remote/
 * locale faces: the plugin registers the sidebar wallet panel and the
 * `x402_pay` keyed tool view, the wallet/payments Remote calls drive the
 * panel store, the `x402/payment` event triggers a refresh, and the
 * invariant companion mounts cleanly. Registration disposal rides the
 * plugin fiber (HMR safety).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context, Service } from '@deepseek-ai/cordis'
import { cleanup } from '@testing-library/react'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import type { X402PaymentRecord, X402WalletState } from '@danielng23/dsh-x402/types'
import { apply, inject } from '../src/client/index.ts'
import { apply as nodeApply } from '../src/index.ts'
import * as X402Invariant from '@danielng23/dsh-x402/invariant'

afterEach(cleanup)

function walletState(): X402WalletState {
  return { configured: true, address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', usdcBalance: '1.000000', network: 'eip155:8453' }
}

function paymentRecord(): X402PaymentRecord {
  return { id: 'x402-1', url: 'https://api.example.test/data', amountUsdc: '0.001000', network: 'eip155:8453', status: 'settled', time: 0 }
}

interface Harness {
  ctx: Context
  remoteCalls: string[]
  forwarded: Record<string, (payload: unknown) => void>
}

async function bench(options: {
  failWith?: { code: string; message: string }
  wallet?: X402WalletState
} = {}): Promise<Harness> {
  const ctx = new Context()
  const remoteCalls: string[] = []
  const forwarded: Record<string, (payload: unknown) => void> = {}
  class RemoteService extends Service {
    constructor(serviceCtx: Context) {
      super(serviceCtx, 'remote')
    }
    $on = (event: string, handler: (payload: unknown) => void) => {
      forwarded[event] = handler
      return () => {}
    }
  }
  new RemoteService(ctx)
  function answer<T>(method: string, value: T) {
    return () => {
      remoteCalls.push(method)
      if (options.failWith !== undefined) return Promise.resolve({ ok: false, error: options.failWith })
      return Promise.resolve({ ok: true, value })
    }
  }
  ctx.provide('remote.x402', {
    wallet: answer('wallet', options.wallet ?? walletState()),
    payments: answer('payments', [paymentRecord()]),
  })
  await ctx.plugin(SlotRegistry).await()
  ctx.slots.register({
    name: 'root',
    children: {
      'sidebar.footer.action': { kind: 'list', scope: 'root' },
      'tool.call.toolview': { kind: 'keyed', scope: 'session' },
    },
  } as never, (() => null) as never)
  ctx.provide('locale', new LocaleRuntime(ctx))
  const fiber = ctx.plugin({ inject, apply })
  await fiber.await()
  return { ctx, remoteCalls, forwarded }
}

function panelStore(ctx: Context): ReturnType<ReturnType<typeof import('../src/client/store.ts').createX402PanelStore>['create']> {
  const entry = ctx.slots.entries('sidebar.footer.action')[0]
  const store = entry?.store as ReturnType<typeof import('../src/client/store.ts').createX402PanelStore> | undefined
  if (store === undefined) throw new Error('x402-panel entry missing its store')
  return store.create()
}

describe('ui-x402 browser plugin', () => {
  it('registers the wallet panel and the x402_pay card and drives the store through the face', async () => {
    const { ctx, remoteCalls } = await bench()
    const panel = ctx.slots.entries('sidebar.footer.action')[0]
    expect(panel?.options).toMatchObject({ id: 'x402-panel' })
    expect(panel?.locale).toBe('x402')
    const toolview = ctx.slots.entries('tool.call.toolview')[0]
    expect(toolview?.options).toMatchObject({ key: 'x402_pay' })
    expect(toolview?.locale).toBe('x402')
    const instance = panelStore(ctx)
    const face = (panel?.inject as (actions: ReturnType<ReturnType<typeof import('../src/client/store.ts').createX402PanelStore>['create']>['actions']) => { refresh: () => Promise<void> })(
      instance.actions,
    )
    await face.refresh()
    expect(remoteCalls).toContain('wallet')
    expect(remoteCalls).toContain('payments')
    expect(instance.getSnapshot().wallet?.configured).toBe(true)
    expect(instance.getSnapshot().payments).toHaveLength(1)
    expect(instance.getSnapshot().error).toBeNull()
  })

  it('surfaces a Remote failure in the panel store', async () => {
    const { ctx } = await bench({ failWith: { code: 'SERVICE_UNAVAILABLE', message: 'RPC unreachable' } })
    const panel = ctx.slots.entries('sidebar.footer.action')[0]
    const instance = panelStore(ctx)
    const face = (panel?.inject as (actions: unknown) => { refresh: () => Promise<void> })(instance.actions)
    await face.refresh()
    expect(instance.getSnapshot().error).toContain('RPC unreachable')
    expect(instance.getSnapshot().wallet).toBeNull()
  })

  it('surfaces a non-Error rejection in the panel store', async () => {
    const ctx = new Context()
    class RemoteService extends Service {
      constructor(serviceCtx: Context) {
        super(serviceCtx, 'remote')
      }
      $on = () => () => {}
    }
    new RemoteService(ctx)
    ctx.provide('remote.x402', {
      wallet: async () => { throw 'wallet blew up' as unknown },
      payments: async () => ({ ok: true as const, value: [] }),
    })
    await ctx.plugin(SlotRegistry).await()
    ctx.slots.register({
      name: 'root',
      children: {
        'sidebar.footer.action': { kind: 'list', scope: 'root' },
        'tool.call.toolview': { kind: 'keyed', scope: 'session' },
      },
    } as never, (() => null) as never)
    ctx.provide('locale', new LocaleRuntime(ctx))
    const fiber = ctx.plugin({ inject, apply })
    await fiber.await()
    const panel = ctx.slots.entries('sidebar.footer.action')[0]
    const instance = panelStore(ctx)
    const face = (panel?.inject as (actions: unknown) => { refresh: () => Promise<void> })(instance.actions)
    await face.refresh()
    expect(instance.getSnapshot().error).toContain('wallet blew up')
    await fiber.dispose()
  })

  it('ignores broadcasts before the panel face materializes', async () => {
    const { forwarded, ctx } = await bench()
    expect(() => { forwarded['x402/payment']?.({ id: 'x402-0', url: 'https://x.test', amountUsdc: '0.001000', network: 'eip155:8453', status: 'settled', time: 0 }) }).not.toThrow()
    expect(() => { ctx.emit('connection/reset') }).not.toThrow()
  })

  it('re-fetches on a connection reset after the face materializes', async () => {
    const { ctx, remoteCalls } = await bench()
    const panel = ctx.slots.entries('sidebar.footer.action')[0]
    const instance = panelStore(ctx)
    const face = (panel?.inject as (actions: unknown) => { refresh: () => Promise<void> })(instance.actions)
    await face.refresh()
    const before = remoteCalls.length
    ctx.emit('connection/reset')
    await vi.waitFor(() => {
      expect(remoteCalls.length).toBeGreaterThan(before)
    })
  })

  it('surfaces a payments failure when the wallet read succeeds', async () => {
    const ctx = new Context()
    class RemoteService extends Service {
      constructor(serviceCtx: Context) {
        super(serviceCtx, 'remote')
      }
      $on = () => () => {}
    }
    new RemoteService(ctx)
    ctx.provide('remote.x402', {
      wallet: async () => ({ ok: true as const, value: walletState() }),
      payments: async () => ({ ok: false as const, error: { code: 'X', message: 'history gone' } }),
    })
    await ctx.plugin(SlotRegistry).await()
    ctx.slots.register({
      name: 'root',
      children: {
        'sidebar.footer.action': { kind: 'list', scope: 'root' },
        'tool.call.toolview': { kind: 'keyed', scope: 'session' },
      },
    } as never, (() => null) as never)
    ctx.provide('locale', new LocaleRuntime(ctx))
    const fiber = ctx.plugin({ inject, apply })
    await fiber.await()
    const panel = ctx.slots.entries('sidebar.footer.action')[0]
    const instance = panelStore(ctx)
    const face = (panel?.inject as (actions: unknown) => { refresh: () => Promise<void> })(instance.actions)
    await face.refresh()
    expect(instance.getSnapshot().error).toContain('history gone')
    await fiber.dispose()
  })

  it('mounts the node half without error', () => {
    expect(() => { nodeApply() }).not.toThrow()
  })

  it('re-fetches when an x402/payment broadcast arrives', async () => {
    const { ctx, remoteCalls, forwarded } = await bench()
    const panel = ctx.slots.entries('sidebar.footer.action')[0]
    const instance = panelStore(ctx)
    const face = (panel?.inject as (actions: unknown) => { refresh: () => Promise<void> })(instance.actions)
    await face.refresh()
    const before = remoteCalls.length
    forwarded['x402/payment']?.({ id: 'x402-9', url: 'https://x.test', amountUsdc: '0.001000', network: 'eip155:8453', status: 'settled', time: 0 })
    await vi.waitFor(() => {
      expect(remoteCalls.length).toBeGreaterThan(before)
    })
  })

  it('re-registers after the plugin fiber reloads (HMR safety)', async () => {
    const ctx = new Context()
    class RemoteService extends Service {
      constructor(serviceCtx: Context) {
        super(serviceCtx, 'remote')
      }
      $on = () => () => {}
    }
    new RemoteService(ctx)
    ctx.provide('remote.x402', {
      wallet: async () => ({ ok: true as const, value: walletState() }),
      payments: async () => ({ ok: true as const, value: [paymentRecord()] }),
    })
    await ctx.plugin(SlotRegistry).await()
    ctx.slots.register({
      name: 'root',
      children: {
        'sidebar.footer.action': { kind: 'list', scope: 'root' },
        'tool.call.toolview': { kind: 'keyed', scope: 'session' },
      },
    } as never, (() => null) as never)
    ctx.provide('locale', new LocaleRuntime(ctx))
    const fiber = ctx.plugin({ inject, apply })
    await fiber.await()
    const before = ctx.slots.entries('sidebar.footer.action').length
    await fiber.dispose()
    expect(ctx.slots.entries('sidebar.footer.action')).toHaveLength(0)
    const again = ctx.plugin({ inject, apply })
    await again.await()
    expect(ctx.slots.entries('sidebar.footer.action')).toHaveLength(before)
    await again.dispose()
  })
})

describe('ui-x402 invariant companion', () => {
  it('mounts without an invariant failure', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry)
    await ctx.plugin(X402Invariant)
    expect(() => { ctx.emit('x402/payment', paymentRecord()) }).not.toThrow()
  })

  it('rejects an invalid payment record', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry)
    await ctx.plugin(X402Invariant)
    expect(() => { ctx.emit('x402/payment', { ...paymentRecord(), amountUsdc: '' }) }).toThrow(/amountUsdc must be non-empty/)
  })
})
