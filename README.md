# dsh-x402-wallet

An installable [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) bundle that mounts the **x402 payment wallet**: the host service `@danielng23/dsh-x402` (four model-facing tools — `x402_discover`, `x402_estimate`, `x402_balance`, `x402_pay`) and the browser GUI `@danielng23/dsh-client-ui-x402` (a Phantom-style wallet popup with multi-wallet management + per-payment conversation cards).

The wallet speaks the [x402](https://www.x402.org/) payment protocol natively (EIP-3009 exact scheme — the wallet signs a transfer authorization and the gateway settles on-chain, so it pays no gas). Every paid call enforces a spend cap and asks the user for approval first.

## Repository layout

```
packages/host/     @danielng23/dsh-x402             host service + tools + /remote
packages/ui/       @danielng23/dsh-client-ui-x402   browser GUI (dsh.client manifest)
packages/bundle/   @danielng23/dsh-x402-wallet      installable patch layer
```

## Install locally (not published yet)

The bundle already points its two dependencies at the sibling packages via `file:` paths, so the whole wallet installs from this checkout with no registry:

```sh
# from the DSH checkout (or anywhere); `pnpm` must be on PATH
dsh plugin --profile web add file:/absolute/path/to/dsh-x402-wallet/packages/bundle
```

Restart `dsh web`. Verified end to end: the bundle lands in `dsh.profile.bundles`, the host service mounts, and the browser boot graph serves the wallet popup. To undo:

```sh
dsh plugin --profile web remove @danielng23/dsh-x402-wallet
```

`dsh plugin add` forwards to `pnpm add` in the profile directory, so a bare relative `file:` path is anchored to your invoking directory; an absolute `file:` path passes through untouched. The `@deepseek-ai/*` peers resolve from the DSH installation's healed `~/.dsh/profiles/node_modules`, so no published DSH packages are needed.

## Install (published)

In any DSH installation (npm registry):

```sh
dsh plugin --profile web add @danielng23/dsh-x402-wallet
```

Or directly from GitHub without a registry:

```sh
dsh plugin --profile web add github:you/dsh-x402-wallet
```

Restart `dsh web`. The sidebar now shows the **x402 钱包** entry, and every session's tool view includes the four `x402_*` tools.

> The wallet is opt-in by design: the shipped DSH web profile does not include it.

## Wallet setup

1. Create a wallet from the popup (**创建钱包** — generate or import a private key) or set the legacy single-key credential `X402_PRIVATE_KEY` (or `export X402_PRIVATE_KEY=0x...`); the popup also supports several wallets with one click to switch.
2. Fund the selected wallet with a few USDC on Base (the receive screen shows the address and a QR code).
3. In the popup, confirm the address and balance, then ask the agent for a task that needs a paid API. Send USDC directly from the popup (**发送**) when you need to move funds out.

Every payment shows an approval prompt with the exact amount and recipient; the call aborts before signing when the cost exceeds `maxCostUsdc` (default 1 USDC). Private keys are stored only in the host's credential store and never enter the conversation, the logs, or the browser page; imported keys travel only from the local GUI to the host over the local Remote.

## Publish

Replace the placeholder scope, then publish the three packages in dependency order:

```sh
# 1. pick your npm scope (one-time)
sed -i '' 's/@danielng23/@YOUR_SCOPE/g' $(grep -rl '@danielng23' .)
sed -i '' 's|@danielng23/dsh-x402|@YOUR_SCOPE/dsh-x402|g' packages/host/lib packages/ui/lib packages/bundle/cordis.patch.yml

# 2. publish host first, then ui, then the bundle
npm publish packages/host
npm publish packages/ui
npm publish packages/bundle
```

`packages/host` and `packages/ui` ship their built `lib/` (the `/remote` typert artifacts included). Rebuilding from source requires the DSH repository's typert generator; to regenerate, build there and copy `lib/` back, or keep the committed artifacts.

## Security stance

- The wallet moves **real money on a real network**. Treat it like shell access with a budget.
- Keep `approvalRequired` true (the default) in any deployment that touches real funds.
- A key exposure costs only the dedicated spending float.
- Peer dependencies (`@deepseek-ai/dsh-*`, `@deepseek-ai/cordis`) resolve from the DSH installation; only the non-DSH dependencies (`@x402/*`, `viem`, `schemastery`, `zod`, `react-qr-code`) are fetched from npm.

## License

MIT
