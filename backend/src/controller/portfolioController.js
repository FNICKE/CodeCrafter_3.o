const db = require("../config/db");

// GET /api/portfolio - Auto create default portfolio if none exists
const getPortfolios = (req, res) => {
  const checkSql = "SELECT id, name FROM portfolios WHERE user_id = ? LIMIT 1";

  db.query(checkSql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (rows.length > 0) {
      res.json({ data: [{ id: rows[0].id, name: rows[0].name }] });
    } else {
      // Auto create default portfolio
      const createSql = "INSERT INTO portfolios (user_id, name, total_value, risk_score) VALUES (?, 'My Portfolio', 0, 5)";
      db.query(createSql, [req.user.id], (err2, result) => {
        if (err2) return res.status(500).json({ message: "Server error" });
        res.json({ data: [{ id: result.insertId, name: 'My Portfolio' }] });
      });
    }
  });
};

// GET /api/portfolio/:id/holdings - Simple & Safe (no created_at)
const getHoldings = (req, res) => {
  const sql = `
    SELECT 
      id,
      portfolio_id,
      symbol,
      asset_name,
      quantity,
      purchase_price,
      current_price
    FROM portfolio_holdings 
    WHERE portfolio_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [req.params.id], (err, rows) => {
    if (err) {
      console.error("Get Holdings Error:", err.message);
      return res.status(500).json({ message: "Failed to fetch holdings" });
    }
    res.json({ data: rows });
  });
};

// POST /api/portfolio/:id/holdings - Simple Add
const addHolding = (req, res) => {
  const portfolioId = req.params.id;
  const { symbol, asset_name, quantity, purchase_price, current_price } = req.body;

  if (!symbol) return res.status(400).json({ message: "Symbol is required" });
  if (!quantity || quantity <= 0) return res.status(400).json({ message: "Valid quantity is required" });
  if (!purchase_price || purchase_price <= 0) return res.status(400).json({ message: "Valid purchase price is required" });

  const sql = `
    INSERT INTO portfolio_holdings 
      (portfolio_id, symbol, asset_name, quantity, purchase_price, current_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    portfolioId,
    symbol.toUpperCase(),
    asset_name || symbol.toUpperCase(),
    parseFloat(quantity),
    parseFloat(purchase_price),
    parseFloat(current_price || purchase_price)
  ], (err) => {
    if (err) {
      console.error("Add Holding Error:", err.message);
      return res.status(500).json({ message: "Failed to add holding" });
    }
    res.status(201).json({ message: "Stock added successfully" });
  });
};

module.exports = { 
  getPortfolios, 
  getHoldings, 
  addHolding 
};