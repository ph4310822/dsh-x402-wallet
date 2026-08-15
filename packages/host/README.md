# @danielng23/dsh-x402

The host service of the **dsh-x402-wallet** plugin: a native [x402](https://www.x402.org/) payment protocol client (EIP-3009 exact scheme) with four model-facing tools — `x402_discover`, `x402_estimate`, `x402_balance`, `x402_pay` — plus multi-wallet custody (create/import/switch), USDC transfers, and on-chain history behind a generated `/remote` API.

Install the whole wallet in one step:

```sh
dsh plugin --profile web add @danielng23/dsh-x402-wallet
```

See the [main repository](https://github.com/ph4310822/dsh-x402-wallet) for the full product README, security stance, and maintainer publishing notes.
