const ink = "#000";
const coral = "#fe7141";
const lilac = "#cdabfe";
const mu = "#5c5c5c";
const line = "#d6d6d6";
const charts = [];

function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function bps(value) {
  const n = num(value);
  if (n === null) return "—";
  return (n > 0 ? "+" : "") + n.toFixed(1);
}

function pct(value) {
  const n = num(value);
  if (n === null) return "—";
  return (n * 100).toFixed(1) + "%";
}

function mount(id) {
  const el = document.getElementById(id);
  const chart = echarts.init(el, null, { renderer: "canvas" });
  charts.push(chart);
  return chart;
}

function base() {
  return {
    backgroundColor: "#fff",
    textStyle: { fontFamily: "Geist Mono, ui-monospace, monospace", color: ink, fontSize: 11 },
    grid: { left: 52, right: 16, top: 18, bottom: 32 },
    tooltip: { trigger: "axis", backgroundColor: "#fff", borderColor: ink, textStyle: { color: ink, fontFamily: "Geist Mono, monospace" } },
    xAxis: { type: "category", axisLabel: { color: mu }, axisLine: { lineStyle: { color: ink } }, axisTick: { show: false } },
    yAxis: { type: "value", axisLabel: { color: mu }, splitLine: { lineStyle: { color: line } }, axisLine: { show: false } },
  };
}

async function main() {
  const [verdict, series] = await Promise.all([
    fetch("data/verdict.json").then((r) => r.json()),
    fetch("data/series.json").then((r) => r.json()),
  ]);
  const w = verdict.window;
  const c1 = verdict.tests.c1_availability;
  const c2 = verdict.tests.c2_price;
  const c3 = verdict.tests.c3_volume;
  document.getElementById("window-meta").textContent =
    `${w.complete_cycles} cycles · ${w.first.slice(0, 16).replace("T", " ")} → ${w.last.slice(0, 16).replace("T", " ")} UTC`;
  document.getElementById("n-success").textContent = pct(w.overall_success_rate);
  document.getElementById("n-success-note").textContent = `${w.successes} of ${w.attempts} · ${c1.status.replaceAll("_", " ")}`;
  document.getElementById("n-gap").textContent = bps(c2.volatile_median_vs_kraken_bps);
  document.getElementById("n-gap-note").textContent = `stable ${bps(c2.stable_median_vs_kraken_bps)} · ${c2.status.replaceAll("_", " ")}`;
  const growth = num(c3.growth_30);
  document.getElementById("n-vol").textContent = growth === null ? "—" : (growth > 0 ? "+" : "") + (growth * 100).toFixed(1) + "%";
  document.getElementById("generated").textContent = "Rebuilt " + verdict.generated_at;
  document.getElementById("hash-line").textContent = "dataset " + verdict.hashes.dataset_sha256.slice(0, 12);

  drawAvailability(series);
  drawBars(verdict);
  drawSizes(verdict);
  drawRoutes(series);
  drawLlama(series);
  drawTable(verdict);
  drawAnchor(verdict);
}

function drawAvailability(series) {
  const opt = base();
  opt.xAxis.data = series.availability.map((row) => row.t.slice(11));
  opt.yAxis.min = 0.75;
  opt.yAxis.max = 1;
  opt.yAxis.axisLabel.formatter = (v) => Math.round(v * 100) + "%";
  opt.series = [{
    type: "line",
    data: series.availability.map((row) => Number(row.rate)),
    showSymbol: false,
    lineStyle: { color: ink, width: 2 },
    areaStyle: { color: "rgba(205,171,254,0.45)" },
  }];
  mount("c-avail").setOption(opt);
}

function drawBars(verdict) {
  const worst = Math.min(...verdict.routes.map((row) => Number(row.median_vs_kraken_bps) || 0));
  const scale = Math.min(worst, -1);
  document.getElementById("gap-bars").innerHTML = verdict.routes.map((row) => {
    const value = num(row.median_vs_kraken_bps);
    const width = value === null ? 0 : Math.max(2, (Math.abs(value) / Math.abs(scale)) * 100);
    const klass = value !== null && value < -40 ? "wide" : "";
    return `<div class="bar"><span>${row.label}</span><i class="${klass}" style="width:${width}%"></i><span class="v">${bps(value)}</span></div>`;
  }).join("");
  document.getElementById("gap-note").textContent =
    "Coral bars are wider than −40 bps. Black bars are inside that line. Width is the absolute gap, not the amount of tokens.";
}

function drawSizes(verdict) {
  const route = verdict.routes.find((row) => row.id === "near_usdc_eth");
  const host = document.getElementById("size-bars");
  if (!route) {
    host.innerHTML = "";
    return;
  }
  const vals = route.sizes.map((row) => Math.abs(Number(row.median_vs_kraken_bps) || 0));
  const scale = Math.max(...vals, 1);
  host.innerHTML = route.sizes.map((row) => {
    const value = num(row.median_vs_kraken_bps);
    const width = value === null ? 0 : Math.max(2, (Math.abs(value) / scale) * 100);
    return `<div class="bar"><span>${row.size_label}</span><i class="${Math.abs(value) > 40 ? "wide" : ""}" style="width:${width}%"></i><span class="v">${bps(value)} · n=${row.n}</span></div>`;
  }).join("");
}

function drawRoutes(series) {
  const ids = Object.keys(series.spread_by_group);
  const controls = document.getElementById("route-controls");
  controls.innerHTML = ids.map((id, index) =>
    `<button type="button" data-route="${id}" aria-pressed="${index === 0 ? "true" : "false"}">${labelOf(series, id)}</button>`
  ).join("");
  const chart = mount("c-route");
  function paint(id) {
    const points = series.spread_by_group[id] || [];
    const sizes = [...new Set(points.map((row) => row.size_label))];
    const times = [...new Set(points.map((row) => row.t))];
    const opt = base();
    opt.legend = { top: 0, right: 0, textStyle: { color: mu, fontFamily: "Geist Mono, monospace", fontSize: 11 } };
    opt.grid.top = 28;
    opt.xAxis.data = times.map((t) => t.slice(11));
    opt.yAxis.axisLabel.formatter = (v) => v;
    opt.series = sizes.map((size, index) => ({
      name: size,
      type: "line",
      showSymbol: false,
      lineStyle: { width: 2, color: index === 0 ? coral : ink },
      itemStyle: { color: index === 0 ? coral : ink },
      data: times.map((t) => {
        const hit = points.find((row) => row.t === t && row.size_label === size);
        return hit ? Number(hit.bps) : null;
      }),
    }));
    chart.setOption(opt, true);
    document.getElementById("route-caption").textContent = labelOf(series, id);
  }
  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    controls.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    paint(button.dataset.route);
  });
  paint(ids[0]);
}

function labelOf(series, id) {
  const found = series.groups.find((row) => row.id === id);
  return found ? found.label : id;
}

function drawLlama(series) {
  const opt = base();
  opt.xAxis.data = series.defillama_daily.map((row) => row.t.slice(2));
  opt.series = [{
    type: "line",
    data: series.defillama_daily.map((row) => Number(row.volume_usd) / 1e6),
    showSymbol: false,
    lineStyle: { color: coral, width: 1.5 },
    areaStyle: { color: "rgba(254,113,65,0.18)" },
  }];
  opt.yAxis.axisLabel.formatter = (v) => v;
  mount("c-llama").setOption(opt);
}

function drawTable(verdict) {
  document.querySelector("#routes tbody").innerHTML = verdict.routes.map((row) => `<tr>
    <td>${row.label}</td>
    <td>${row.family}</td>
    <td class="n">${row.successes}/${row.attempts}</td>
    <td class="n">${bps(row.median_vs_kraken_bps)}</td>
    <td class="n">${bps(row.median_vs_okx_bps)}</td>
    <td class="n">${bps(row.median_usd_mark_bps)}</td>
  </tr>`).join("");
}

function drawAnchor(verdict) {
  const anchor = verdict.anchor;
  const host = document.getElementById("anchor-copy");
  if (!anchor) {
    host.textContent = "No testnet anchor file was present at rebuild.";
    return;
  }
  const lines = (anchor.anchors || []).map((item) =>
    `${item.snapshot_id} · ${item.sha256_hex.slice(0, 16)}… · ${item.tx}`
  );
  host.innerHTML = `Testnet <code>${anchor.account_id}</code>. Deploy <a href="https://explorer.testnet.near.org/transactions/${anchor.deploy_tx}">${anchor.deploy_tx}</a>.<br>${lines.map((line) => {
    const tx = line.split(" · ").pop();
    return `<a href="https://explorer.testnet.near.org/transactions/${tx}">${line}</a>`;
  }).join("<br>")}`;
}

window.addEventListener("resize", () => charts.forEach((chart) => chart.resize()));
main().catch((err) => {
  document.getElementById("window-meta").textContent = "Could not read data/verdict.json (" + err.message + ").";
});
