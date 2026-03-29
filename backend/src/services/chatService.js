const OpenAI = require("openai");

// Import controllers
const { getPortfolioRisk } = require("../controller/riskController");
const { getHoldings } = require("../controller/portfolioController");
const { getQuote } = require("../controller/marketController");
const { getNews, getMarketSentiment } = require("../controller/researchController");
const { getSmartRecommendations } = require("../controller/recommendationController");
const { getAnalystReport } = require("../controller/reportsController");

// ✅ GROQ CONFIG
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ✅ TOOL DEFINITIONS
const tools = [
  {
    type: "function",
    function: {
      name: "get_portfolio_risk",
      description: "Get full risk analysis for a portfolio",
      parameters: {
        type: "object",
        properties: {
          portfolioId: { type: "string" },
        },
        required: ["portfolioId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_holdings",
      description: "Get all holdings in a portfolio",
      parameters: {
        type: "object",
        properties: {
          portfolioId: { type: "string" },
        },
        required: ["portfolioId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_quote",
      description: "Get real-time stock/crypto price",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string" },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_news",
      description: "Get latest news",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string" },
          category: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_smart_recommendations",
      description: "Get stock recommendations based on ₹ budget",
      parameters: {
        type: "object",
        properties: {
          budget: { type: "number" },
        },
        required: ["budget"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_analyst_report",
      description: "Get analyst report",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_market_sentiment",
      description: "Get overall market sentiment",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

// ✅ TOOL EXECUTION
async function executeTool(toolCall) {
  const { name, arguments: argsStr } = toolCall.function;
  let params = {};

  try {
    params = JSON.parse(argsStr || "{}");
  } catch (e) {
    console.error("Argument parse error:", e.message);
  }

  try {
    switch (name) {
      case "get_portfolio_risk":
        return await getPortfolioRisk(
          { params: { portfolioId: params.portfolioId } },
          { json: (d) => d }
        );

      case "get_holdings":
        return await getHoldings(
          { params: { id: params.portfolioId } },
          { json: (d) => d }
        );

      case "get_quote":
        return await getQuote(
          { params: { symbol: params.symbol } },
          { json: (d) => d }
        );

      case "get_news":
        return await getNews(
          { query: params },
          { json: (d) => d }
        );

      case "get_smart_recommendations":
        return await getSmartRecommendations(
          { body: { budget: params.budget } },
          { json: (d) => d }
        );

      case "get_analyst_report":
        return await getAnalystReport(
          { params: { ticker: params.ticker } },
          { json: (d) => d }
        );

      case "get_market_sentiment":
        return await getMarketSentiment({}, { json: (d) => d });

      default:
        return { error: `Tool "${name}" not implemented` };
    }
  } catch (err) {
    console.error(`Tool error (${name}):`, err.message);
    return { error: `Execution failed: ${name}` };
  }
}

module.exports = { openai, tools, executeTool };