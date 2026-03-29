const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are StockSense (formerly HackTrix), the official AI banking and financial assistant.
Your sole purpose is to provide insights related to finance, the stock market, macroeconomics, and this application. 
If a user asks about general knowledge, programming, non-finance history, or casual topics unrelated to the platform/finance, politely decline and steer them back to market analysis.

Capabilities of the StockSense Platform (This Project):
1. **Smart Stock Predictor**: A recommendation engine that generates optimal portfolios based on budget, user risk appetite, jurisdiction, and strategy.
2. **Sector Screener**: Visualizes real-time capital flow across macro ETFs and SPDR sectors.
3. **Doc AI Analyzer / Research Library**: Uses AI to instantly extract strategic breakdowns from dense broker PDFs and SEC filings.
4. **Regulatory Filings (SEC)**: Fetches raw, unfiltered company filings (10-K, 10-Q, 8-K) for transparency.
5. **Stock Summary / Deep Quote**: Provides a live Bullish/Bearish AI ensemble score for any valid ticker, calculating momentum, analyst bias, and Finnhub news sentiment.
6. **Veracity Engine / TrustFeed**: Cross-references general news and outputs a "Trust Score" (0-100) based on source reputation, recency, and potential bias.

RULES:
- You have access to backend finance tools. 
- If the user asks about a specific stock (e.g., 'How is Apple doing?' or 'What is AAPL stock price?'), ALWAYS use the 'get_stock_summary' tool to fetch live data.
- If the user asks for the latest news on a stock or the general market, ALWAYS use the 'get_stock_news' tool.
- Never invent quotes or news. Rely purely on the tools.
- If the user asks about how the platform works, explain the capabilities listed above.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_stock_summary",
      description: "Gets the live quote, AI prediction (Bullish/Bearish), Risk Assessment, and analyst outlook for a specific stock ticker.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "The stock ticker symbol, e.g., AAPL, MSFT, TSLA" },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_stock_news",
      description: "Gets the latest financial news. Can optionally target a specific stock ticker.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Optional. The stock ticker symbol for company-specific news, e.g., AAPL. Leave empty for general market news." },
        },
      },
    },
  }
];

const handleChat = async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format." });
  }

  // Inject system prompt exactly once
  const chatContext = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    // 1st Generation pass
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: chatContext,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.1,
      },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
    );

    let messageData = response.data.choices[0].message;

    // Check if Groq wants to call a backend controller tool
    if (messageData.tool_calls && messageData.tool_calls.length > 0) {
      chatContext.push(messageData); // record the assistant's tool call

      // Process all tool calls
      for (const toolCall of messageData.tool_calls) {
        if (toolCall.function.name === "get_stock_summary") {
          const args = JSON.parse(toolCall.function.arguments);
          try {
            console.log("Chatbot calling internal backend for summary:", args.symbol);
            const token = req.headers.authorization;
            const selfCall = await axios.get(
              `http://localhost:5000/api/summary/${encodeURIComponent(args.symbol)}`,
              { headers: { Authorization: token }, timeout: 15000 }
            );
            
            chatContext.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify({
                symbol: selfCall.data.symbol,
                price: selfCall.data.quote.current,
                prediction: selfCall.data.prediction.label,
                confidence: selfCall.data.prediction.confidence,
                risk: selfCall.data.risk.level,
              }),
            });
          } catch (toolErr) {
             chatContext.push({
               role: "tool",
               tool_call_id: toolCall.id,
               name: toolCall.function.name,
               content: JSON.stringify({ error: "Stock ticker not found or internal server error." }),
             });
          }
        } 
        else if (toolCall.function.name === "get_stock_news") {
          const args = JSON.parse(toolCall.function.arguments || "{}");
          try {
            console.log("Chatbot fetching news for:", args.symbol || "general");
            const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";
            let url = "";
            if (args.symbol) {
              const to = new Date().toISOString().split('T')[0];
              const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              url = `https://finnhub.io/api/v1/company-news?symbol=${args.symbol}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;
            } else {
              url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`;
            }
            const newsCall = await axios.get(url, { timeout: 15000 });
            
            // send top 5 news
            const data = Array.isArray(newsCall.data) ? newsCall.data : [];
            const topNews = data.slice(0, 5).map(n => ({
              headline: n.headline,
              summary: n.summary,
              source: n.source,
            }));
            
            chatContext.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify(topNews),
            });
          } catch (toolErr) {
             chatContext.push({
               role: "tool",
               tool_call_id: toolCall.id,
               name: toolCall.function.name,
               content: JSON.stringify({ error: "Could not fetch news from API." }),
             });
          }
        }
        else {
           chatContext.push({
             role: "tool",
               tool_call_id: toolCall.id,
               name: toolCall.function.name,
               content: JSON.stringify({ error: "Unknown tool utilized." }),
           });
        }
      }

      // 2nd Generation pass with the tool results
      const finalResponse = await axios.post(
        GROQ_API_URL,
        {
          model: "llama-3.3-70b-versatile",
          messages: chatContext,
          temperature: 0.1,
        },
        { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
      );
      
      messageData = finalResponse.data.choices[0].message;
    }

    res.json({ role: "assistant", content: messageData.content });

  } catch (err) {
    console.error("Chat Controller Error:", err.response?.data || err.message);
    res.status(500).json({ error: "The AI assistant encountered a network error linking to Groq." });
  }
};

module.exports = { handleChat };
