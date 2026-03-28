const db = require("../config/db");
const { getStockData } = require("../services/stockService");

const fetchStock = async (req, res) => {
  try {
    const apiData = await getStockData(req.params.symbol);

    const price = apiData["Global Quote"]["05. price"];

    // Ensure the table exists dynamically
    db.query(
      "CREATE TABLE IF NOT EXISTS stocks (id INT PRIMARY KEY AUTO_INCREMENT, symbol VARCHAR(50), price DECIMAL(15,4), sentiment VARCHAR(50))",
      (err) => {
        if (!err && price) {
          // Save to MySQL
          db.query(
            "INSERT INTO stocks (symbol, price, sentiment) VALUES (?, ?, ?)",
            [req.params.symbol.toUpperCase(), price, "Neutral"]
          );
        }
      }
    );

    res.json(apiData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { fetchStock };
