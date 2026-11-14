# Pre-registration

Written before the systematic sample. Six manual `dry: true` probes were sent while checking that the public endpoints answered. Those probes are **not** rows in `data/raw`. They are disclosed here so the bars below are not presented as blind.

Probe USD retention, from the 1Click fields `amountOutUsd / amountInUsd - 1`, on 2026-11-14 around 03:09–03:10 UTC:

| Probe | USD gap |
| --- | --- |
| 10 wNEAR → USDC (Ethereum) | −112.7 bps |
| 100 USDC (Ethereum) → USDC (Solana) | −2.9 bps |
| 0.05 ETH (Ethereum) → SOL | −33.0 bps |
| 0.002 BTC → ETH (Ethereum) | −31.6 bps |
| 100 USDT (Ethereum) → USDT (Tron) | −21.2 bps |
| 1 SOL → wNEAR | 0.0 bps on 1Click's own USD marks |

Those USD marks are not the official price test. The official price test compares token amounts with a Kraken cross-mid. The probes only showed that quotes return and that the all-in gap is sometimes much wider than the documented 25 bps unauthenticated fee.

## Question

Is NEAR becoming a cross-chain settlement layer via NEAR Intents?

A few hours of quotes cannot establish “becoming.” This sample tests three narrower statements.

## What is measured

- **Quote.** `POST https://1click.chaindefuser.com/v0/quote` with `dry: true`, `swapType: EXACT_INPUT`, `slippageTolerance: 100`, `quoteWaitingTimeMs: 0` unless noted. No API key. The public fee schedule (fetched into `docs/sources/near-intents-fees.md`) says unauthenticated non-`ANY_INPUT` quotes carry an extra **25 bps** on top of the 0.0001% on-chain protocol fee. That fee stays inside the measured price. It is not subtracted in the official test.
- **Basket.** `collector/basket.json`. Ten routes, two sizes each (20 standard quotes). One extra patient quote (`quoteWaitingTimeMs: 2000`) on 10 wNEAR → USDC (Ethereum) is a side comparison and is **excluded** from the availability denominator and from the price medians.
- **Success.** HTTP 201 and a positive integer `quote.amountOut`.
- **Effective price.** `amountOut / amountIn` in whole tokens, using integer amounts and the token decimals in the basket. Floats from `*Formatted` are not used for the test.
- **Primary CEX cross.** Kraken public ticker, mid = (best bid + best ask) / 2 in USD. Cross = `mid(origin) / mid(destination)`, in destination tokens per 1 origin token. Same cycle as the quote.
- **Gap.** `(effective / kraken_cross - 1) * 10000` basis points. Negative means the quote returns less output than the Kraken cross-mid.
- **Secondary marks, not used for pass/fail.** OKX USDT mids, Coinbase USD mids where the product exists, and 1Click's own `amountInUsd` / `amountOutUsd`.
- **Public volume.** DefiLlama `GET https://api.llama.fi/summary/dexs/near-intents` daily `totalDataChart`, plus the volume block server-rendered on `https://explorer.near-intents.org/` (the Explorer API itself returns `MISSING_TOKEN` without a JWT and is not used). The two sources are reported separately and are never averaged.
- **NEAR chain.** `https://rpc.mainnet.near.org` `status`, and `https://api.nearblocks.io/v1/stats`.

## Tests

A verdict is `insufficient` until **10** completed cycles exist. Point estimates are still published.

### C1 — Availability

- **Pass** if overall success on the 20 standard quotes is **≥ 85%**, and **at least 8 of 10** routes have a success rate **≥ 70%**.
- **Falsified** if overall success is **< 50%**, or fewer than **5** routes ever return a quote.
- Otherwise **not supported**.

### C2 — Price versus Kraken

Families, fixed in the basket:

- **Stable / same-asset:** USDC Ethereum→Solana, USDT Ethereum→Tron, USDC Ethereum→Base, ETH Arbitrum→Ethereum.
- **Volatile:** the other six routes.

Median is the median of successful standard quotes in that family across the whole window.

- **Pass** if the stable median gap is **≥ −40 bps** and the volatile median gap is **≥ −100 bps**.
- **Falsified** if the stable median is **< −100 bps** or the volatile median is **< −200 bps**.
- If one family passes and the other is only “not supported,” C2 is **not supported**.
- If either family is falsified, C2 is **falsified**.
- Quotes with no Kraken cross for that cycle are dropped from the median, not filled with zero.

### C3 — Public volume direction (descriptive)

Not a pass/fail of the investment claim.

Using DefiLlama daily bars, drop the last bar if its UTC date is the UTC date of the rebuild (it may be a partial day). Then:

`growth_30 = sum(last 30 bars) / sum(the 30 bars before those) - 1`

- **expanding** if `growth_30 > 0.10`
- **contracting** if `growth_30 < -0.10`
- **flat** otherwise

Explorer homepage totals are a point-in-time cross-check. They do not enter `growth_30`.

## What this does not claim

Passing C1 and C2 would mean that, in this window, unauthenticated dry quotes were usually available and not far from Kraken mids. It would not mean NEAR has become the cross-chain settlement layer. Dry quotes are not settled swaps. One venue's mid is not the tradable cost of a CEX market order. The unauthenticated fee is in the gap. The window is hours.

## Hashes

`analysis/hashutil.py` defines the manifests that the testnet contract anchors.

- **Method manifest:** `PREREGISTRATION.md`, `collector/basket.json`, `docs/sources/near-intents-fees.md`.
- **Dataset manifest:** every file under `data/raw/` except `state.json`, `heartbeat.json`, and `*.log`, in sorted relative-path order. Each line is `path<TAB>sha256<TAB>bytes\n`. The anchored hash is the SHA-256 of that UTF-8 document.

Snapshot ids are append-only on chain. A later sample does not overwrite an earlier hash.
