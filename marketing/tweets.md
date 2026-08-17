# DSH X402 Wallet — launch tweets (English)

10 startup tweets. Post order: 1 → 3 → 5 → 2 → 7 → 4 → 8 → 9 → 6 → 10. Always end a demo post with the install line.

---

**1. Launch / hero (pin this one)**

Your agent can finally pay for APIs.

DSH X402 Wallet brings the x402 payment protocol into DeepSeek Harness: discover paid APIs, estimate the cost, and pay-and-call them — with a real wallet in the sidebar.

No CLI. No extension. Install:
`dsh plugin --profile web add @danielng23/dsh-x402-wallet`

---

**2. Why HTTP 402 matters (education)**

HTTP 402 is the only status code with no meaning — yet.

Today's APIs bill agents per call via 402 + crypto payment requirements. The agent that can pay unlocks the entire paid-API economy.

We just built the wallet that makes that work. 🧵 below:

---

**3. Gasless payments (education)**

Why x402 payments are gasless:

1. Your wallet signs an EIP-3009 transfer authorization
2. The API gateway settles on-chain
3. You pay $0 in gas

The wallet never touches the network — just signs. That's the "exact" scheme.

---

**4. The money clip (build in public)**

Real talk: our 0.1.2 release fixed a nasty bug — switching wallets kept signing with the old one.

An agent wallet that pays from the wrong account is a bug you don't want. Now balance, history, and signing all follow the selected wallet. Shipped.

---

**5. Demo GIF — agent pays (hero shot)**

The moment it clicked: I asked the agent to fetch paid data, it probed the price, asked me to approve, paid, and returned the result. All inside DSH.

Your agent can do this today:
`dsh plugin --profile web add @danielng23/dsh-x402-wallet`

---

**6. Wallet ≠ hot wallet (education / security)**

Our stance on custody:

- Keys live in the host credential store — never in model context, logs, or the browser
- Every payment needs your approval with the exact amount
- A spend cap aborts before signing if the price exceeds it

Treat it like shell access with a budget.

---

**7. Product philosophy (opinion)**

"Agent wallets" shouldn't be browser extensions or CLI tools.

They should be where the agent works — inside the harness GUI, next to the conversation.

That's why DSH X402 Wallet is a popup in the sidebar, not another tab.

---

**8. QR receive (demo)**

Send USDC to your agent's wallet the same way you pay a friend: open the popup, scan the QR, done.

Receive screen with live balance refresh — the wallet knows when funds land. 🧵

---

**9. x402 ecosystem (community)**

The x402 catalog is full of paid APIs waiting for agents that can pay them.

We're contributing one piece of the rails: a first-class wallet for DSH. If you're building on x402 — let's cross-promote. DMs open.

---

**10. Call to action (soft close)**

A visual x402 payment wallet for DeepSeek Harness.

Your agent discovers, estimates, and pays for APIs. You approve every dollar. Keys never leave your machine.

Install in one line:
`dsh plugin --profile web add @danielng23/dsh-x402-wallet`
