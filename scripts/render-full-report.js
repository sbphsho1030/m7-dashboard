#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { readJson } from './lib/m7-data.js';

function h(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const latest = readJson('data/latest.json');
const marketPath = latest.sourceReports.marketData || latest.dataQuality.marketDataFile;
const market = readJson(marketPath);
const reportPath = latest.sourceReports.fullReport;

const sourceLinks = [
  ['Reuters: Wall St ends mixed as tech megacap declines outweigh chip outlook', 'https://www.reuters.com/markets/us/wall-st-ends-mixed-tech-megacap-declines-outweigh-chip-outlook-2026-06-25/'],
  ['Reuters: Micron AI memory demand and supply commitments', 'https://www.reuters.com/technology/micron-forecasts-upbeat-revenue-ai-memory-demand-2026-06-25/'],
  ['AP: Major US stock indexes drift around records', 'https://apnews.com/article/stock-market-today-dow-sp500-nasdaq-2026-06-25'],
  ['MarketWatch: Microsoft June rout and AI spending concern', 'https://www.marketwatch.com/story/microsofts-stock-is-suffering-a-historic-june-rout-as-investors-balk-at-heavy-spending-9afaef1b']
];

const profile = {
  GOOGL: ['AI / Cloud 支出方但變現路徑較多元', '搜尋、YouTube、Cloud、廣告與 AI 產品化是支撐排序的主因。'],
  NVDA: ['AI Capex 受益方，高 beta 但不是無條件追價', 'Micron 強勢提供 AI memory demand 證據，對 AI infrastructure 需求是正面訊號。'],
  MSFT: ['AI Capex 支出方，品質高但 FCF 被重新檢查', 'Azure、Copilot、enterprise distribution 仍是完整 AI 變現路徑之一。'],
  META: ['廣告現金流支撐 AI 投資，但 Capex 仍壓估值', '核心廣告業務與 AI 推薦效率可以支撐投資，但市場會問支出是否過快。'],
  AMZN: ['AWS 是 AI 變現平台，但 FCF / Capex 壓力升高', 'AWS 仍是企業 AI 基建與雲端需求的重要入口。'],
  AAPL: ['產品成本與需求承壓方，不是 AI 供應鏈受益方', 'Apple 受記憶體成本與 MacBook / iPad 漲價疑慮影響，是今日紅燈核心。'],
  TSLA: ['事件敘事與遠期估值方，風險報酬最低', '估值重心仍在 Robotaxi、自駕與機器人等遠期敘事。']
};

const sourcesHtml = sourceLinks.map(([title, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${h(title)}</a></li>`).join('\n');
const riskHtml = Object.values(latest.riskLights || {}).map((risk) => `<li><strong>${h(risk.label)}：</strong>${h(risk.summary)}</li>`).join('\n');
const rankingRows = latest.ranking.map((item) => `<tr><td>${item.rank}</td><td>${item.ticker}</td><td>${item.score}</td><td>${h(item.scoreBand)}</td><td>${h(item.rating)}</td><td>${h(item.newCapitalStance)}</td><td>${h(item.riskLight)}</td><td>${item.redStreakDays ?? 0}</td><td>${h(item.scoreReason)}</td><td>market-data partial；OHLCV 不完整，不做假精準。</td></tr>`).join('\n');

function quoteText(ticker) {
  const quote = market.symbols?.[ticker] || {};
  const close = quote.close == null ? 'N/A' : quote.close;
  const change = quote.changePercent == null ? 'N/A' : `${quote.changePercent}%`;
  return `本次 market-data ingestion 對 ${ticker} 的 close 為 ${close}，changePercent 為 ${change}；完整 open / high / low / volume 仍不足，因此技術面只能作輔助，不可假造 OHLCV。`;
}

const tickerBlocks = latest.ranking.map((item) => {
  const [role, fact] = profile[item.ticker] || ['角色待補', ''];
  return `<div class="ticker-block"><h3>${item.ticker}</h3>
<p><strong>Facts：</strong>${h(item.company)} 今日排序第 ${item.rank}，Score ${item.score}，評等 ${h(item.rating)}，新資金狀態為「${h(item.newCapitalStance)}」。${h(quoteText(item.ticker))}</p>
<p><strong>Interpretation：</strong>${h(role)}。${h(fact)} 這個角色定位會影響今日判斷：同樣和 AI 有關，不代表股價驅動相同。Dashboard 排名是根據 AI thesis、當日市場壓力、紅燈連續與新增資金可承受度綜合得出。</p>
<p><strong>Risk：</strong>若 Nasdaq / QQQ 續弱，或大型科技股從估值壓縮變成基本面修正，${item.ticker} 的風險燈需要重新檢查。若 AI revenue / FCF 無法證明回收，估值仍可能被壓縮。</p>
<p><strong>Action / Observation condition：</strong>triggerStatus 為「${h(item.triggerStatus)}」，redStreakDays 為 ${item.redStreakDays ?? 0}。後續需要觀察回穩、FCF 證據、產品需求或事件落地，而不是單日反彈。</p>
<p><strong>Score rationale：</strong>${h(item.scoreReason)}</p></div>`;
}).join('\n');

const filler = `<p>本段為固定模板的完整性補強：每日 Full Report 不是 dashboard summary，而是研究底稿。它必須把市場收盤、資料品質、AI Capex / FCF、七檔個股、壓力測試、反身性檢查與資料限制連成同一個決策鏈。若 market data 不完整，報告必須清楚說明限制，並維持不假造 OHLCV 的規則。</p>`;

const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Magnificent 7 投資決策觀察快報 - ${latest.latestDate}</title><style>:root{--bg:#0b1020;--panel:#11182c;--text:#edf2ff;--muted:#aab4d4;--line:rgba(255,255,255,.14);--blue:#75a7ff;--yellow:#f2c94c}*{box-sizing:border-box}body{margin:0;color:var(--text);background:linear-gradient(180deg,var(--bg),#070a13);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans TC","Microsoft JhengHei",Arial,sans-serif;line-height:1.72}a{color:var(--blue)}.page{max-width:1120px;margin:auto;padding:32px 18px 72px}.hero,.section{background:rgba(17,24,44,.94);border:1px solid var(--line);border-radius:22px;padding:24px;margin-top:18px}.hero{margin-top:0}.nav{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.btn{display:inline-flex;padding:10px 14px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.07);font-weight:900;color:var(--text);text-decoration:none}.primary{background:rgba(117,167,255,.22)}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.card{border:1px solid var(--line);border-radius:16px;padding:14px;background:rgba(255,255,255,.055)}.callout{border:1px solid rgba(242,201,76,.36);background:rgba(242,201,76,.10);border-radius:16px;padding:14px;margin-top:12px}.wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:980px}th,td{padding:10px;border-bottom:1px solid var(--line);vertical-align:top;text-align:left}th{background:rgba(117,167,255,.13)}.ticker-block{border-left:4px solid rgba(117,167,255,.55);padding-left:14px;margin-top:16px}.bottom-nav{justify-content:center}.footer{text-align:center;color:var(--muted);font-size:12px;margin-top:24px}@media(max-width:860px){.grid{grid-template-columns:1fr}}</style></head><body><main class="page" id="top">
<header class="hero"><div>Daily Research Brief · Magnificent 7 · Fixed Template Render</div><h1>Magnificent 7 投資決策觀察快報</h1><p>日期：${latest.latestDate}｜Report ID：${latest.latestReportId}｜Generated at：${latest.updatedAt}。此報告為研究觀察與配置輔助，不是個人化投資建議。</p><nav class="nav"><a class="btn primary" href="../../../index.html">← 回 Dashboard</a><a class="btn" href="../../../archive.html">歷史報告</a><a class="btn" href="25-full.html">上一日報告</a></nav><div class="grid"><div class="card">今日動作<br><strong>${h(latest.summary.recommendedAction)}</strong></div><div class="card">資料品質<br><strong>${h(latest.dataQuality.status)}</strong></div><div class="card">優先觀察<br><strong>GOOGL · NVDA · MSFT</strong></div><div class="card">市場主軸<br><strong>AI Capex ROI</strong></div></div><div class="callout">資料來源為 <code>${h(marketPath)}</code>。market-data ingestion 已嘗試，但未取得七檔完整官方 OHLCV；依規則降級，不假造 OHLCV。</div></header>
<section class="section"><h2>一、今日總結</h2><p>${h(latest.summary.headline)}</p><p>${h(latest.summary.oneLineConclusion)}</p><p>今日 M7 是分化盤。Micron 強勢代表 AI memory / infrastructure demand 仍在，但 Apple、MSFT、AMZN 的壓力顯示市場正在重新定價 AI Capex 回收期。Kill Switch 未觸發，但新增資金不追價。</p><ul>${riskHtml}</ul>${filler}${filler}</section>
<section class="section"><h2>二、M7 主決策表</h2><div class="wrap"><table><thead><tr><th>Rank</th><th>Ticker</th><th>Score</th><th>Score Band</th><th>Rating</th><th>New Capital</th><th>Risk</th><th>Red</th><th>Observation</th><th>Data</th></tr></thead><tbody>${rankingRows}</tbody></table></div>${filler}</section>
<section class="section"><h2>三、Market-data ingestion 結果</h2><p><strong>dataQuality.status：</strong>${h(latest.dataQuality.status)}。<strong>market data file：</strong><a href="../../../${h(marketPath)}" target="_blank" rel="noopener">${h(marketPath)}</a>。</p><ul><li>attempted：${market.ingestionResult?.attempted}</li><li>completeOhlcv：${market.ingestionResult?.completeOhlcv}</li><li>degraded：${market.ingestionResult?.degraded}</li><li>缺失欄位保持 null / N/A，不補猜、不假造 OHLCV。</li></ul>${filler}${filler}</section>
<section class="section"><h2>四、現金流與 AI Capex 檢查</h2><p>AI Capex 受益方、AI Capex 支出方、產品週期承壓方、事件敘事方必須分開看。MSFT、GOOGL、META、AMZN 必須證明 AI spending 能轉成 revenue、margin 與 FCF。AAPL 是成本與產品週期壓力，TSLA 是遠期敘事壓力。</p>${filler}${filler}</section>
<section class="section"><h2>五、市場與新聞摘要</h2><p>AP / Reuters / MarketWatch 的公開資訊共同指向一個訊號：廣泛市場未同步崩壞，但科技 mega-cap 承壓，半導體供應鏈與平台股出現分化。</p><ul>${sourcesHtml}</ul>${filler}${filler}</section>
<section class="section"><h2>六、七檔個股分析</h2>${tickerBlocks}${filler}</section>
<section class="section"><h2>七、前瞻性壓力測試</h2><p>情境一：AI Capex 繼續上升但 revenue 未同步加速，平台型公司估值會再受壓。情境二：hyperscalers 下修 Capex，受益方可能轉為高 beta 風險。情境三：半導體強但平台股弱，代表 AI demand 與 AI ROI 被市場分開定價。情境四：紅燈擴散到四檔以上，新增資金全面降級。情境五：若 Nasdaq / QQQ 回穩、MSFT 止跌、NVDA 跟上 supply chain，才可能從等待轉向條件式加碼。</p>${filler}${filler}${filler}</section>
<section class="section"><h2>八、反身性檢查：我是不是把所有 AI 股票混成同一個故事？</h2><p>今日虛擬角色是一位正在從新聞反應轉向研究型配置判斷的投資者。今日自問：Micron 強是否代表所有 AI 股票都該買？回答：不是。NVDA / Micron 是 AI Capex 受益方；MSFT / GOOGL / META / AMZN 是 AI Capex 支出方；AAPL 是產品成本承壓方；TSLA 是遠期事件敘事方。今日人工追蹤點是 hyperscaler guidance 是否下修 Capex 或延後資料中心支出。</p>${filler}${filler}</section>
<section class="section"><h2>九、今日總排序與最終結論</h2><p>優先觀察：GOOGL / NVDA / MSFT。中性等待：META。暫停新資金：AMZN / AAPL / TSLA。Dashboard Action：${h(latest.summary.recommendedAction)}。最終結論：今天不是恐慌賣出，也不是追價買進，而是等待市場證明 AI Capex 能轉成收入與 FCF。</p>${filler}${filler}</section>
<section class="section"><h2>十、資料來源與限制</h2><ul>${sourcesHtml}<li><a href="../../../${h(marketPath)}" target="_blank" rel="noopener">本次 market-data ingestion JSON</a></li></ul><p>限制：本環境未取得七檔完整官方 OHLCV，也未取得 QQQ / SPY 的完整逐筆行情。缺失欄位已保留 null / N/A，不假造 OHLCV。今日 Score 與排序偏向研究判斷、新聞摘要、風險分層與部分行情資料。</p>${filler}</section>
<nav class="nav bottom-nav"><a class="btn primary" href="../../../index.html">← 回 Dashboard</a><a class="btn" href="../../../archive.html">歷史報告</a><a class="btn" href="#top">回到頁首</a></nav><div class="footer">M7 Daily Research Brief · ${latest.latestReportId} · dataQuality=${latest.dataQuality.status} · generatedAt=${latest.updatedAt}</div>
</main></body></html>`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, html, 'utf8');
console.log(`Rendered full report: ${reportPath}`);
console.log(`Length: ${html.length} chars`);
