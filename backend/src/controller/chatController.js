const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are HackBot, the official AI banking and financial assistant for the 'HackTrix Smart Finance Platform'.
Your sole purpose is to provide insights related to finance, the stock market, macroeconomics, and this application. 
If a user asks about general knowledge, programming, non-finance history, or casual topics unrelated to the platform/finance, politely decline and steer them back to market analysis.

Capabilities of the HackTrix Platform (This Project):
1. **Smart Stock Predictor**: A recommendation engine that generates optimal portfolios based on budget, user risk appetite, jurisdiction, and strategy.
2. **Sector Screener**: Visualizes real-time capital flow across macro ETFs and SPDR sectors.
3. **Doc AI Analyzer**: Uses Node-NLP to instantly extract 5-point strategic breakdowns from dense 100+ page broker PDFs and SEC filings.
4. **Regulatory Filings (SEC)**: Fetches raw, unfiltered company filings (10-K, 10-Q, 8-K, Form 4) for transparency.
5. **Deep Quote & Predictor**: Provides a 'Bullish/Bearish' AI ensemble score for any valid ticker, calculating momentum, analyst bias, and Finnhub news sentiment.

If the user asks questions about HOW the project works, use the text above. 
If the user asks for stock advice, DO NOT invent quotes. You have access to backend finance tools. 
Use the 'get_stock_summary' tool to fetch live data if they ask about a specific symbol (e.g., 'How is Apple doing?').
Only mention the tool if you really need to explain your data logic.`;

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

      // Process all tool calls (usually just one)
      for (const toolCall of messageData.tool_calls) {
        if (toolCall.function.name === "get_stock_summary") {
          const args = JSON.parse(toolCall.function.arguments);
          try {
            console.log("Chatbot calling internal backend for:", args.symbol);
            // Forward the existing Authorization token to keep auth context
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
              content: JSON.stringify({ error: "Could not fetch stock data from internal controller." }),
            });
          }
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
