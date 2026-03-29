const axios = require("axios");

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "d73ns7pr01qjjol3m9l0d73ns7pr01qjjol3m9lg";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

/** Soft cap so one huge daily move does not dominate the score */
function momentumContribution(dayChangePct) {
  if (typeof dayChangePct !== "number" || Number.isNaN(dayChangePct)) return 0;
  const x = Math.max(-12, Math.min(12, dayChangePct));
  return Math.tanh(x / 5) * 28;
}

/** Lexicon proxy on recent headlines when news-sentiment API is empty / blocked */
function headlineLexiconScore(newsItems) {
  if (!Array.isArray(newsItems) || newsItems.length === 0) return { score: 0, detail: "No headlines to score" };
  const bullish = /\b(buy|beat|surge|upgrade|growth|record|bullish|gain|rally|soar|strong|outperform|raises?\s+(guidance|forecast)|profit|expansion)\b/i;
  const bearish = /\b(sell|miss|lawsuit|cut|downgrade|bearish|plunge|drop|crash|Probe|investigation|layoff|debt|concern|warning|underperform)\b/i;
  let net = 0;
  let hit = 0;
  for (const n of newsItems.slice(0, 10)) {
    const t = `${n.headline || ""} ${n.summary || ""}`;
    const b = bullish.test(t) ? 1 : 0;
    const s = bearish.test(t) ? 1 : 0;
    if (b || s) hit += 1;
    net += b - s;
  }
  const denom = Math.max(4, Math.min(10, newsItems.length));
  const score = Math.max(-1, Math.min(1, net / denom));
  return {
    score,
    detail:
      hit > 0
        ? `Keyword tone from ${hit} headline(s) (bullish/bearish word hints — rough proxy)`
        : "Headlines had no strong bullish/bearish keyword hits",
  };
}

function analystConsensusBias(latestRec) {
  if (!latestRec) return 0;
  const buy = (latestRec.strongBuy ?? latestRec.strong_buy ?? 0) + (latestRec.buy || 0);
  const sell = (latestRec.strongSell ?? latestRec.strong_sell ?? 0) + (latestRec.sell || 0);
  const hold = latestRec.hold || 0;
  const total = buy + sell + hold;
  if (total <= 0) return 0;
  return Math.max(-1, Math.min(1, (buy - sell) / total));
}

/**
 * Confidence from normalized components in roughly [−1, 1]: active signal count + agreement.
 */
function agreementConfidence(normalizedComponents) {
  const active = normalizedComponents.filter((c) => Math.abs(c) >= 0.12);
  if (active.length === 0) return 34;
  const signs = active.map((c) => (c > 0 ? 1 : -1));
  const same = signs.every((s) => s === signs[0]);
  let base = 40 + active.length * 7;
  if (same) base += 14;
  if (new Set(signs).size > 1) base -= 14;
  return Math.max(30, Math.min(78, Math.round(base)));
}

/**
 * GET /api/summary/:symbol
 */
const getStockSummary = async (req, res) => {
  const raw = (req.params.symbol || "").trim().toUpperCase();
  if (!raw || raw.length > 12) {
    return res.status(400).json({ message: "Valid symbol required" });
  }

  const today = new Date().toISOString().split("T")[0];
  const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    const [quoteRes, profileRes, newsRes, sentimentRes, recRes, targetRes, metricRes] = await Promise.all([
      axios.get(`${FINNHUB_BASE}/quote?symbol=${raw}&token=${FINNHUB_API_KEY}`),
      axios.get(`${FINNHUB_BASE}/stock/profile2?symbol=${raw}&token=${FINNHUB_API_KEY}`).catch(() => ({ data: {} })),
      axios.get(`${FINNHUB_BASE}/company-news?symbol=${raw}&from=${past}&to=${today}&token=${FINNHUB_API_KEY}`).catch(() => ({ data: [] })),
      axios.get(`${FINNHUB_BASE}/news-sentiment?symbol=${raw}&token=${FINNHUB_API_KEY}`).catch(() => ({ data: {} })),
      axios.get(`${FINNHUB_BASE}/stock/recommendation?symbol=${raw}&token=${FINNHUB_API_KEY}`).catch(() => ({ data: [] })),
      axios.get(`${FINNHUB_BASE}/stock/price-target?symbol=${raw}&token=${FINNHUB_API_KEY}`).catch(() => ({ data: {} })),
      axios.get(`${FINNHUB_BASE}/stock/metric?symbol=${raw}&metric=all&token=${FINNHUB_API_KEY}`).catch(() => ({ data: {} })),
    ]);

    const q = quoteRes.data || {};
    const price = q.c;
    const prevClose = q.pc;
    const dayChangePct = typeof q.dp === "number" ? q.dp : null;

    if (price == null || price === 0) {
      return res.status(404).json({ message: "Quote not available for this symbol. Check the ticker." });
    }

    const profile = profileRes.data || {};
    const newsList = Array.isArray(newsRes.data) ? newsRes.data : [];
    const latestNews = newsList
      .slice()
      .sort((a, b) => (b.datetime || 0) - (a.datetime || 0))
      .slice(0, 12)
      .map((n) => ({
        id: n.id,
        headline: n.headline,
        summary: n.summary,
        source: n.source,
        url: n.url,
        image: n.image,
        datetime: n.datetime,
      }));

    const sent = sentimentRes.data || {};
    const buzz = sent.buzz || {};
    const companyNewsScore = typeof sent.companyNewsScore === "number" ? sent.companyNewsScore : null;
    const hasFinnhubSentiment = companyNewsScore !== null;

    const { score: lexScore, detail: lexDetail } = headlineLexiconScore(latestNews);

    const recommendations = Array.isArray(recRes.data) ? recRes.data : [];
    const latestRec = recommendations.length ? recommendations[0] : null;
    const analystBias = analystConsensusBias(latestRec);

    const mom = momentumContribution(dayChangePct);
    const analystPart = analystBias * 26;
    const finnhubSentPart = hasFinnhubSentiment ? companyNewsScore * 22 : 0;
    const lexPart = hasFinnhubSentiment ? lexScore * 7 : lexScore * 20;
    const buzzAdj = typeof buzz.buzz === "number" ? (Math.min(1, Math.max(0, buzz.buzz)) - 0.5) * 8 : 0;

    let signalScore = mom + analystPart + finnhubSentPart + lexPart + buzzAdj;
    signalScore = Math.max(-100, Math.min(100, signalScore));

    const normMom = mom / 28;
    const normAnalyst = analystBias;
    const normSent = hasFinnhubSentiment ? companyNewsScore : lexScore;
    const confidence = agreementConfidence([normMom, normAnalyst, normSent]);

    let predictionLabel = "Neutral";
    if (signalScore >= 22) predictionLabel = "Bullish";
    else if (signalScore >= 9) predictionLabel = "Lean Bullish";
    else if (signalScore <= -22) predictionLabel = "Bearish";
    else if (signalScore <= -9) predictionLabel = "Lean Bearish";

    const reasons = [];
    if (typeof dayChangePct === "number") {
      reasons.push(
        `Price momentum (today): ${dayChangePct >= 0 ? "+" : ""}${dayChangePct.toFixed(2)}% → contributes ${mom.toFixed(1)} pts (tanh-capped)`
      );
    }
    if (latestRec) {
      reasons.push(`Analyst stance (${latestRec.period || "latest"}): net buy–sell bias ${analystBias.toFixed(2)} (−1…+1)`);
    } else {
      reasons.push("Analyst recommendation trend: not returned (tier/plan may limit this)");
    }
    if (hasFinnhubSentiment) {
      reasons.push(`Finnhub company news sentiment: ${companyNewsScore.toFixed(3)} (−1…+1)`);
    } else {
      reasons.push(`Finnhub sentiment API: no score in response — headline keyword proxy (${lexDetail})`);
    }
    if (buzz.articlesInLastWeek != null) {
      reasons.push(`News volume: ~${buzz.articlesInLastWeek} articles in Finnhub buzz window`);
    }

    const absMove = typeof dayChangePct === "number" ? Math.abs(dayChangePct) : 0;
    const metricData = metricRes.data || {};
    const m = metricData.metric || {};
    const betaVal = typeof m.beta === "number" && !Number.isNaN(m.beta) ? m.beta : null;

    let riskLevel = "Medium";
    let riskScore = 38 + Math.min(40, absMove * 5);
    if (betaVal != null) {
      riskScore += Math.min(18, Math.max(0, (betaVal - 1) * 10));
      if (betaVal > 1.35) riskLevel = "High";
      else if (betaVal < 0.85 && absMove < 2) riskLevel = "Low-Medium";
    }
    if (absMove >= 4) riskLevel = "High";
    else if (absMove >= 2 && riskLevel !== "High") riskLevel = "Medium-High";
    else if (absMove < 1 && (betaVal == null || betaVal <= 1.1)) riskLevel = "Low-Medium";

    riskScore = Math.round(Math.min(100, riskScore));

    const riskFactors = [];
    riskFactors.push(`Latest session |Δ%|: ~${absMove.toFixed(2)}%`);
    if (betaVal != null) riskFactors.push(`Beta (~market sensitivity): ${betaVal.toFixed(2)}`);
    else riskFactors.push("Beta: not returned for this symbol/tier");
    if (latestNews.length === 0) riskFactors.push("Few/zero recent headlines in feed");
    else riskFactors.push(`${latestNews.length} recent headlines — read for real catalysts`);

    const targetData = targetRes.data || {};
    const targetHigh = targetData.targetHigh;
    const targetMean = targetData.targetMean;
    const targetLow = targetData.targetLow;
    let upsidePct = null;
    if (typeof targetMean === "number" && targetMean > 0 && price > 0) {
      upsidePct = ((targetMean - price) / price) * 100;
    }

    let profitOutlook = "neutral";
    if (upsidePct != null && upsidePct > 3) profitOutlook = "positive";
    else if (upsidePct != null && upsidePct < -3) profitOutlook = "negative";
    else if (signalScore > 12) profitOutlook = "positive";
    else if (signalScore < -12) profitOutlook = "negative";

    const profitNote =
      upsidePct != null
        ? `Analyst mean target ${targetMean != null ? `$${Number(targetMean).toFixed(2)}` : "n/a"} vs last $${price.toFixed(2)} (~${upsidePct >= 0 ? "+" : ""}${upsidePct.toFixed(1)}% vs mean).`
        : `No analyst mean target in this response. Profit outlook follows the same ensemble as the directional prediction (not a price forecast).`;

    res.json({
      symbol: raw,
      name: profile.name || raw,
      currency: profile.currency || "USD",
      exchange: profile.exchange || null,
      quote: {
        current: price,
        previousClose: prevClose,
        change: q.d,
        changePercent: dayChangePct,
        high: q.h,
        low: q.l,
        open: q.o,
      },
      prediction: {
        label: predictionLabel,
        confidence,
        score: Math.round(signalScore),
        horizon: "near-term (days–weeks)",
        summary:
          "Ensemble of (1) dampened daily momentum, (2) analyst buy/hold/sell mix when available, (3) Finnhub company sentiment or headline keyword proxy, (4) small buzz adjustment. This estimates short-term tilt, not a guaranteed price path.",
        drivers: reasons,
        methodology:
          "Weighted blend with tanh on daily % change so noise does not swamp fundamentals; confidence rises when independent signals agree.",
        signalsUsed: {
          momentumPoints: Math.round(mom * 10) / 10,
          analystPoints: Math.round(analystPart * 10) / 10,
          finnhubSentimentPoints: Math.round(finnhubSentPart * 10) / 10,
          headlineLexiconPoints: Math.round(lexPart * 10) / 10,
          buzzAdjustPoints: Math.round(buzzAdj * 10) / 10,
        },
        limitation: "Markets are not predictable with certainty; this output is informational only.",
      },
      risk: {
        level: riskLevel,
        score: riskScore,
        factors: riskFactors,
        disclaimer: "Heuristic risk from volatility and beta when available — not VaR or stress testing.",
      },
      profit: {
        outlook: profitOutlook,
        upsideVsMeanTargetPercent: upsidePct != null ? Number(upsidePct.toFixed(2)) : null,
        targetMean: targetMean != null ? Number(targetMean) : null,
        targetHigh: targetHigh != null ? Number(targetHigh) : null,
        targetLow: targetLow != null ? Number(targetLow) : null,
        note: profitNote,
        disclaimer: "Not investment advice. Targets may be missing on free tiers.",
      },
      news: latestNews,
      analystRecommendation: latestRec,
    });
  } catch (err) {
    console.error("getStockSummary:", err.message);
    res.status(500).json({ message: "Failed to build summary", error: err.message });
  }
};

module.exports = { getStockSummary };
