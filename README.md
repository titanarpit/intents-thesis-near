# Intents Thesis

Live site: https://intents-thesis-near.pages.dev
Repository: https://github.com/titanarpit/intents-thesis-near

Track: `thesis` (also entered in `open`).

## Question

Is NEAR becoming a cross-chain settlement layer via NEAR Intents?

A few hours of quotes cannot establish "becoming". This project tests three narrower, pre-registered statements and publishes the result as a static report. The bars were written down before the sample in [`site/PREREGISTRATION.md`](site/PREREGISTRATION.md).

## Problem

Claims that NEAR Intents is "the settlement layer" are usually made from volume headlines. A volume headline does not say whether a quote is actually there when a user asks for one, or how far the returned token amount sits from a market price anyone can see. Those two questions can be measured from public endpoints, and the result can be fixed in time so it cannot be quietly edited afterwards.

## What it is

A static report site (`site/`) built from a 3-hour sample taken on 2026-11-14 (03:17–06:30 UTC):

- **62 complete cycles, 1,240 standard quotes.** Each cycle sent 20 `dry: true` quotes to `POST https://1click.chaindefuser.com/v0/quote` (NEAR Intents 1Click, no API key): ten routes across NEAR, Ethereum, Solana, Bitcoin, Tron, Base and Arbitrum, two sizes each, plus one excluded "patient" quote.
- **C1 Availability — pass.** 1,232 of 1,240 quotes returned an amount (99.4%); 10 of 10 routes at or above 70%. The 8 misses were 2 Cloudflare 520s, 1 incomplete response and 5 timeouts at 50 s.
- **C2 Price vs Kraken cross-mid — pass.** Stable/same-asset median −2.1 bps (n=495), volatile median −28.1 bps (n=737). The documented 25 bps unauthenticated fee is inside these numbers and is not subtracted.
- **C3 Public volume direction (descriptive) — contracting.** DefiLlama daily NEAR Intents volume: last 30 days 3.80B USD vs prior 30 days 4.84B USD, growth −21.5%.

Reading: in this window the quote layer answered and priced close to Kraken mids, but the public volume series was not expanding. That does not show NEAR "has become" the settlement layer; see Limits.

## How NEAR is used

- **NEAR Intents 1Click** is the object of study. Every quote is `dry: true`; no deposit address is used, nothing is swapped, no funds move.
- **NEAR testnet anchor.** The method manifest and the dataset manifest were SHA-256 hashed and written to the testnet contract `intents-thesis-d163.testnet` with an append-only `anchor` call:

| Snapshot | SHA-256 | Transaction |
| --- | --- | --- |
| `method-v1` (PREREGISTRATION.md, basket, fee source) | `df72528b…eb8cfb` | [8LMEu3g9…](https://explorer.testnet.near.org/transactions/8LMEu3g9MpxDhBoZnJeH2Crkh7GEda7G5xtyJrnYmNPX) |
| `dataset-20261114T063024Z` (26 raw files) | `a3d5d294…cf6eb2d` | [2fKHAWgT…](https://explorer.testnet.near.org/transactions/2fKHAWgThhs2QaUit8SD5QbuqZubHC9zM3buomuthQ8L) |

Account creation: [98UeKtYQ…](https://explorer.testnet.near.org/transactions/98UeKtYQFoava6rMUKbK9KGAJWZbJj9ynst46FP9SsFz). Contract deploy: [5efuoH6Q…](https://explorer.testnet.near.org/transactions/5efuoH6Qz7pct4HVBozYEk5bpVq6YuTXU18Agi6rFDPs), code hash `sd3YsBmsDytbgT1Wsyy5yf6yJDasu7RefCWFA5cH3sT`.

- **NEAR mainnet RPC and NearBlocks stats** (read-only) supply the block-time chart.

The anchor shows the bytes were not edited after the sample. It does not make a quote true.

## Do this, see that

1. Open https://intents-thesis-near.pages.dev. The claim, the three test results and the sample window load from `data/verdict.json`.
2. Scroll to **03 · Evidence**. Fig. 1 is availability per cycle, Fig. 2 the median gap vs Kraken per route, Fig. 3 lets you pick one route, Fig. 5 is DefiLlama daily volume.
3. Scroll to **Data**. The route table and the testnet anchor transactions are listed; the links open NEAR testnet explorer.
4. Run `python3 scripts/verify_anchor.py`. It reads the anchor list in `site/data/verdict.json`, fetches each transaction from NEAR testnet RPC, and prints `OK` when the on-chain `snapshot_id`, `sha256_hex` and `byte_length` match, and when the contract's code hash matches. Exit code 1 on any mismatch. Python 3 standard library only; it signs nothing.

## Run locally

No build step and no dependencies. Serve the `site/` folder with any static server:

```sh
python3 -m http.server 8080 --directory site
# open http://127.0.0.1:8080/
```

Opening `index.html` straight from disk may block the `fetch` of `data/*.json` in some browsers, so use a server.

Cloudflare Pages: no build command, output directory `site`.

## What is in this repository

| Path | Contents |
| --- | --- |
| `site/index.html`, `site/app.js`, `site/styles.css`, `site/thesis.html` | The report page |
| `site/data/verdict.json` | Test results, per-route medians, volume figures, manifest hashes, anchor transactions |
| `site/data/series.json` | Chart series derived from the raw sample |
| `site/charts/*.svg` | Static chart renders |
| `site/PREREGISTRATION.md` | The pre-registered method and pass/falsify bars |
| `site/vendor/` | Apache ECharts (Apache-2.0) and web fonts (SIL OFL). These keep their own licenses |
| `scripts/verify_anchor.py` | Read-only check of the testnet anchors |

**Not included in this snapshot:** the quote collector and basket file (`collector/`), the analysis scripts (`analysis/rebuild.py`, `analysis/hashutil.py`), the raw rows (`data/raw/`), the fee-source copy (`docs/sources/`) and the anchor contract source. The page text refers to those paths. They were part of the working directory that produced `verdict.json` and `series.json` and were not recovered for this repository. As a result the dataset hash cannot be recomputed from this repository; the anchors can be checked on chain with `scripts/verify_anchor.py`, and the published numbers can be read directly from `site/data/verdict.json`.

## Hackathon window

The sample, the testnet anchors and the site date from 2026-11-14, inside the hackathon window. The code was written with an AI coding agent (Q-005). No API keys are used or stored.

## Limits

- Three hours on one day is a snapshot, not a trend. "Becoming" is not tested.
- A dry quote is not a settled transfer.
- The gap is mid against mid. A central-book order would pay a spread and fees this comparison does not add, so the comparison is harsh on Intents.
- 1Click's own USD marks sometimes disagree with the token amounts; they are shown but are not the official test.
- Same-asset routes are closer to a bridge quote than to price discovery.
- DefiLlama and the Intents explorer homepage disagree on 7-day, 30-day and all-time totals; they are reported separately and never averaged.
- Binance's ticker returned HTTP 451 from the collection host and was not used.
- Testnet only for the anchor. No mainnet transaction was signed.
