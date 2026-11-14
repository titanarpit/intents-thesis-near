#!/usr/bin/env python3
"""Check the NEAR testnet anchors listed in site/data/verdict.json.

For each anchor it fetches the transaction from NEAR testnet RPC, decodes the
`anchor` function-call arguments, and compares snapshot_id, sha256_hex and
byte_length with verdict.json. It also checks that the anchor account's code
hash matches `near_code_hash`. Read-only: it signs nothing.
Python 3 standard library only. Exit code 1 on any mismatch.
"""
import base64, json, pathlib, sys, urllib.request

RPC = "https://archival-rpc.testnet.near.org"
ROOT = pathlib.Path(__file__).resolve().parent.parent

def rpc(method, params):
    req = urllib.request.Request(RPC, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
                                 headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        out = json.load(r)
    if "error" in out:
        raise RuntimeError(out["error"])
    return out["result"]

def main():
    verdict = json.loads((ROOT / "site/data/verdict.json").read_text())
    a = verdict["anchor"]
    acct = a["account_id"]
    ok = True
    view = rpc("query", {"request_type": "view_account", "finality": "final", "account_id": acct})
    same = view["code_hash"] == a["near_code_hash"]
    ok &= same
    print(f"{acct} code_hash {view['code_hash']} {'OK' if same else 'MISMATCH'}")
    for item in a["anchors"]:
        res = rpc("tx", {"tx_hash": item["tx"], "sender_account_id": acct, "wait_until": "NONE"})
        tx = res["transaction"]
        calls = [x["FunctionCall"] for x in tx["actions"] if "FunctionCall" in x and x["FunctionCall"]["method_name"] == "anchor"]
        args = json.loads(base64.b64decode(calls[0]["args"])) if calls else {}
        good = (tx["receiver_id"] == acct and "SuccessValue" in res["status"]
                and args.get("snapshot_id") == item["snapshot_id"]
                and args.get("sha256_hex") == item["sha256_hex"]
                and args.get("byte_length") == item["byte_length"])
        ok &= good
        print(f"{item['snapshot_id']}: tx {item['tx']} sha256 {args.get('sha256_hex')} {'OK' if good else 'MISMATCH'}")
    hashes = verdict["hashes"]
    print(f"verdict.json method_sha256={hashes['method_sha256']} dataset_sha256={hashes['dataset_sha256']}")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
