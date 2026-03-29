const axios = require("axios");

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const GROQ_API_KEY    = process.env.GROQ_API_KEY;
const GROQ_MODEL      = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const FINNHUB_BASE    = "https://finnhub.io/api/v1";
const USD_TO_INR      = 83.5;

/* ═══════════════════════════════════════════════════════════
   SENTIMENT ENGINE
═══════════════════════════════════════════════════════════ */
const POSITIVE_WORDS = ["surge","beat","record","growth","bullish","upgrade","profit","soar","gain","strong","rally","outperform","boost","buy","milestone","expansion","revenue","positive","optimistic","innovation"];
const NEGATIVE_WORDS = ["fall","loss","miss","cut","decline","bearish","downgrade","drop","weak","risk","sell","negative","layoff","lawsuit","fraud","crash","investigation","penalty","fine","disappointing"];

function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  let score = 0;
  POSITIVE_WORDS.forEach(w => { if (lower.includes(w)) score++; });
  NEGATIVE_WORDS.forEach(w => { if (lower.includes(w)) score--; });
  return Math.max(-5, Math.min(5, score));
}

function sentimentLabel(score) {
  if (score > 2)  return "Very Bullish";
  if (score > 0)  return "Mildly Bullish";
  if (score === 0) return "Neutral";
  if (score > -2) return "Mildly Bearish";
  return "Very Bearish";
}

/* ═══════════════════════════════════════════════════════════
   GROQ AI CALL
═══════════════════════════════════════════════════════════ */
async function askAI(systemPrompt, userPrompt, maxTokens = 2000) {
  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt }
      ],
      temperature: 0.35,
      max_tokens: maxTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data.choices[0].message.content;
}

/* ═══════════════════════════════════════════════════════════
   MARKET DATA FETCHER
═══════════════════════════════════════════════════════════ */
async function getEnhancedStockData(symbols, budgetInr = 500000) {
  const results = [];

  for (const symbol of symbols) {
    try {
      const [quoteRes, newsRes] = await Promise.all([
        axios.get(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
        axios.get(`${FINNHUB_BASE}/company-news?symbol=${symbol}&from=${
          new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0]
        }&to=${new Date().toISOString().split("T")[0]}&token=${FINNHUB_API_KEY}`)
      ]);

      const q = quoteRes.data;
      const priceUSD = q.c || 0;
      const priceINR = +(priceUSD * USD_TO_INR).toFixed(2);
      const rawSentiment = newsRes.data.reduce((sum, n) => sum + analyzeSentiment(n.headline), 0);
      const sentimentScore = Math.max(-5, Math.min(5, rawSentiment));
      const affordableShares = priceINR > 0 ? Math.floor(budgetInr / priceINR) : 0;

      results.push({
        symbol,
        priceUSD,
        priceINR,
        changePercent: +(q.dp || 0).toFixed(2),
        high52w: q.h || null,
        low52w:  q.l || null,
        openPrice: q.o || null,
        prevClose: q.pc || null,
        sentimentScore,
        sentimentLabel: sentimentLabel(sentimentScore),
        newsCount: newsRes.data.length,
        recentHeadlines: newsRes.data.slice(0, 3).map(n => n.headline),
        affordableShares,
        totalCostINR: +(affordableShares * priceINR).toFixed(2),
        remainingINR: +(budgetInr - affordableShares * priceINR).toFixed(2),
      });
    } catch (err) {
      console.error(`[MarketData] Error for ${symbol}:`, err.message);
    }
  }

  return results;
}

/* ═══════════════════════════════════════════════════════════
   SYSTEM PROMPT (shared persona)
═══════════════════════════════════════════════════════════ */
const ADVISOR_SYSTEM = `You are NeuroAlpha, a world-class AI investment strategist with deep expertise in equity markets, portfolio construction, technical analysis, and personal finance for Indian investors (INR-based).

FORMATTING RULES (strictly follow these):
- Use proper markdown: ## for section headers, ### for sub-headers, **bold** for key values, *italic* for emphasis
- Use markdown tables for any tabular data (stock allocations, comparisons, SIP projections)
- Use bullet lists (- item) for strategy points, risks, and action items
- NEVER use raw asterisks like ** outside of bold/italic markdown
- NEVER output plain text walls — always structure the response clearly
- Start every response with ## 📌 User Summary (2-3 lines paraphrasing the user's goal)
- Always show prices in BOTH USD and INR
- Always quantify: mention exact amounts, percentages, share counts
- Be direct, practical, and beginner-friendly
- End with ## ⚠️ Risk Disclaimer (2 lines, standard financial disclaimer)`;

/* ═══════════════════════════════════════════════════════════
   1. MAIN AI PREDICTION
═══════════════════════════════════════════════════════════ */
const getAIPrediction = async (req, res) => {
  try {
    const {
      query,
      symbols = ["AAPL", "MSFT", "NVDA"],
      budget = 500000,
      riskTolerance = "moderate",
      horizon = "medium",
      needsLiquidity = false,
    } = req.body;

    if (!query) return res.status(400).json({ error: "Query required" });

    const marketData = await getEnhancedStockData(symbols, budget);

    const horizonMap = { short: "under 6 months", medium: "1–2 years", long: "3+ years" };
    const riskMap = { low: "Conservative (capital protection)", moderate: "Moderate (balanced growth)", high: "Aggressive (maximum returns)" };

    const userPrompt = `
## USER QUERY
"${query}"

## INVESTOR PROFILE
| Parameter | Value |
|-----------|-------|
| Budget | ₹${budget.toLocaleString('en-IN')} (approximately $${(budget / USD_TO_INR).toFixed(0)}) |
| Risk Tolerance | ${riskMap[riskTolerance]} |
| Investment Horizon | ${horizonMap[horizon]} |
| Needs Emergency Liquidity | ${needsLiquidity ? "Yes — must be withdrawable within 3–6 months" : "No"} |

## LIVE MARKET DATA
${JSON.stringify(marketData, null, 2)}

## INSTRUCTIONS
Generate a comprehensive investment prediction and action plan. Include all of the following sections:

## 📌 User Summary
(Briefly restate the user's goal and situation)

## 📊 Stock Analysis & Prediction
For each stock in the market data:
- Current price (USD + INR), trend direction
- Sentiment: mention the sentimentLabel and what recent news suggests
- Prediction: BUY / HOLD / SELL recommendation with reasoning
- Target price range for the given horizon

## 💼 Recommended Portfolio Allocation
Create a table:
| Stock | Price (USD) | Price (INR) | Shares | Allocated (INR) | Allocation % | Action |
Show exact share counts based on budget ₹${budget.toLocaleString('en-IN')}

## 📈 Entry & Exit Strategy
- Entry point (buy zone)
- Target exit price
- Stop-loss level
- Time-based exit if horizon reached

## 🔁 SIP Option (if applicable)
If the user's horizon is medium or long, suggest a monthly SIP amount and projected returns table at 10%, 12%, 15% annual returns over 1, 3, 5 years.

## 💧 Liquidity Notes
${needsLiquidity
  ? "Address emergency fund strategy — which assets can be liquidated fast, suggest liquid alternatives like liquid mutual funds or ETFs alongside equity."
  : "Brief note on portfolio liquidity for this allocation."}

## ⚠️ Risk Disclaimer
(Standard 2-line disclaimer)
`;

    const advice = await askAI(ADVISOR_SYSTEM, userPrompt, 2000);

    res.json({ success: true, advice, marketData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   2. QUICK STOCK ADVICE
═══════════════════════════════════════════════════════════ */
const getQuickStockAdvice = async (req, res) => {
  try {
    const { symbol, budget = 100000 } = req.body;
    if (!symbol) return res.status(400).json({ error: "Symbol required" });

    const [stockData] = await getEnhancedStockData([symbol], budget);

    const userPrompt = `
## STOCK: ${symbol}

## LIVE DATA
${JSON.stringify(stockData, null, 2)}

## TASK
Give a quick analysis. Structure your response as:

## 📌 Quick Take
One sentence verdict.

## 📊 Price Summary
| Metric | Value |
Show: Current USD, Current INR, Today's change %, Open, Prev Close

## ⚡ Signal
**BUY / HOLD / SELL** — with a 2–3 line justification based on price action and sentiment.

## 🎯 Entry & Target
- Buy Zone: 
- Target (3 months):
- Stop Loss:

## 📰 Sentiment
Sentiment score: ${stockData?.sentimentScore} (${stockData?.sentimentLabel})
Recent headlines and what they imply.

## ⚠️ Risk Disclaimer
`;

    const advice = await askAI(ADVISOR_SYSTEM, userPrompt, 800);
    res.json({ advice, data: stockData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   3. PORTFOLIO BUILDER
═══════════════════════════════════════════════════════════ */
const getPortfolioBuilder = async (req, res) => {
  try {
    const { budget, riskProfile = "moderate" } = req.body;
    const symbols = ["AAPL", "MSFT", "GOOGL", "NVDA", "AMZN"];
    const marketData = await getEnhancedStockData(symbols, budget);

    const userPrompt = `
## PORTFOLIO BUILDING REQUEST

Budget: ₹${Number(budget).toLocaleString('en-IN')}
Risk Profile: ${riskProfile}

## LIVE MARKET DATA
${JSON.stringify(marketData, null, 2)}

## TASK
Build an optimized portfolio. Structure as:

## 📌 User Summary

## 💼 Recommended Portfolio
| Stock | Price (INR) | Shares | Amount (INR) | Weight % | Rationale |
Ensure total allocation ≤ ₹${budget}

## 📊 Diversification Breakdown
Explain sector exposure, geographic risk, and why this mix suits the ${riskProfile} profile.

## 📈 Expected Performance
| Scenario | 1 Year Return | 3 Year Return |
|----------|---------------|---------------|
| Bear Case | | |
| Base Case | | |
| Bull Case | | |

## 🔁 Rebalancing Schedule
Suggest when and how to rebalance.

## ⚠️ Risk Disclaimer
`;

    const portfolio = await askAI(ADVISOR_SYSTEM, userPrompt, 1500);
    res.json({ portfolio, data: marketData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   4. SIP CALCULATOR & PLAN
═══════════════════════════════════════════════════════════ */
const getSIPCalculator = async (req, res) => {
  try {
    const { monthlyAmount, years, riskProfile = "moderate" } = req.body;
    if (!monthlyAmount || !years) return res.status(400).json({ error: "monthlyAmount and years required" });

    const userPrompt = `
## SIP PLANNING REQUEST

Monthly SIP Amount: ₹${Number(monthlyAmount).toLocaleString('en-IN')}
Investment Duration: ${years} years
Risk Profile: ${riskProfile}

## TASK

## 📌 User Summary

## 🔢 SIP Projection Table
| Year | Total Invested (₹) | At 8% p.a. | At 12% p.a. | At 15% p.a. |
Show year-by-year for each year up to ${years} years.

## 💼 Suggested SIP Instruments
Based on ${riskProfile} risk, recommend:
- 2–3 Indian mutual fund categories (e.g. Large Cap, ELSS, Flexi Cap)
- 1–2 US stock/ETF options (via INDmoney or similar)
- 1 debt/liquid fund for stability

For each: Expected CAGR, Liquidity, Min investment

## 📈 Wealth Building Strategy
- When to increase SIP (step-up SIP)
- Tax efficiency (ELSS for 80C)
- Goal-based milestones for ₹${(monthlyAmount * 12 * years).toLocaleString('en-IN')} total invested

## ⚠️ Risk Disclaimer
`;

    const sipPlan = await askAI(ADVISOR_SYSTEM, userPrompt, 1200);
    res.json({ sipPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   5. EMERGENCY / LIQUID FUND STRATEGY  (new endpoint)
═══════════════════════════════════════════════════════════ */
const getLiquidStrategy = async (req, res) => {
  try {
    const { budget, emergencyMonths = 6 } = req.body;

    const userPrompt = `
## LIQUID / EMERGENCY INVESTMENT REQUEST

Total Budget: ₹${Number(budget).toLocaleString('en-IN')}
Needs full liquidity within: ${emergencyMonths} months

## TASK

## 📌 User Summary

## 💧 Liquidity-First Portfolio
Split the ₹${budget} intelligently:

| Bucket | Instrument | Amount (₹) | Liquidity | Expected Return |
- Bucket 1: Emergency (immediate access)
- Bucket 2: Short-term (1–6 months)
- Bucket 3: Growth (remainder, slightly longer)

## 📊 Instrument Details
For each recommended instrument, explain:
- What it is
- How to invest
- Withdrawal timeline
- Risk level

## ⚠️ Risk Disclaimer
`;

    const strategy = await askAI(ADVISOR_SYSTEM, userPrompt, 1000);
    res.json({ strategy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAIPrediction,
  getQuickStockAdvice,
  getPortfolioBuilder,
  getSIPCalculator,
  getLiquidStrategy,
};