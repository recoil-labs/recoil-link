# Recoil Link Explorer

Look up any Recoil Link message: where it was sent, whether it was delivered, and how long it took.

It is a static page with no backend. The browser reads the Mailboxes on every supported network directly over public RPCs, so there is no indexer or database to run. Same stack and brand as [`../website`](../website): Vite, React, Tailwind v4 and [viem](https://viem.sh).

## What it does

- **Search** by message id, or by the hash of the transaction that sent or delivered a message. It shows:
  - the route, and Delivered or Waiting for delivery
  - send and delivery times, how long delivery took, and links to both transactions
  - nonce, sender, recipient and the body (as text when printable)
  - the gas paid to the gas paymaster
- **Waiting messages** refresh every 10 seconds until delivered. A message sent without a gas payment gets a warning, because the relayer won't deliver it.
- **Latest messages** lists what was sent on any network in the last 3 hours.
- Results have shareable links: `?q=<message id or transaction hash>`.

## How lookups work

| You paste              | The explorer                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A dispatch transaction | Finds the receipt on whichever chain has it, decodes each `Dispatch`, and asks the destination Mailbox `processedAt(id)`                                                                                                        |
| A delivery transaction | Reads the `ProcessId` events in it and looks each message up by id                                                                                                                                                              |
| A message id           | Asks every Mailbox `processedAt(id)`. If delivered, it finds the delivery in that one block and the dispatch on the origin chain in the 6 hours before it. If not, it searches the last 3 hours on every chain for the dispatch |

Limits that come from having no indexer:

- An **undelivered** message is found by id only if it was sent in the last 3 hours. Its dispatch transaction hash always works.
- A **delivered** message whose dispatch came more than 6 hours before delivery shows the delivery only.

Chains, RPCs and contract addresses are in [`src/lib/chains.ts`](src/lib/chains.ts). Each chain lists two RPCs, tried in order. The first must answer `eth_getLogs` over `logRange` blocks: `sepolia.base.org` refuses log queries, and some of publicnode's OP Sepolia nodes prune logs only hours old. Block times are measured, not assumed: Base Sepolia makes a block every 0.2 s and BSC testnet every 0.45 s.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173 (pass --port to change)
npm test           # unit tests: message decoding and formatting
npm run build
```

## Configuration

| Variable           | Used at    | Purpose                                                           |
| ------------------ | ---------- | ----------------------------------------------------------------- |
| `VITE_DOCS_URL`    | build time | Docs site base URL. Defaults to `https://docs.link.recoilpay.com` |
| `VITE_WEBSITE_URL` | build time | Website URL. Defaults to `https://link.recoilpay.com`             |

## Deploy

Same as the website: the Dockerfile builds the site and serves `dist/` with nginx on `$PORT` (default 8080).

```bash
docker build -t recoil-link-explorer .   # production links by default; pass --build-arg VITE_DOCS_URL=… to point elsewhere
docker run -p 8080:8080 recoil-link-explorer
```
