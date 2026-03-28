const db = require("../config/db");

// GET /api/portfolio - get all portfolios for logged-in user
const getPortfolios = (req, res) => {
  const sql = `
    SELECT p.*, 
      COUNT(ph.id) AS holding_count,
      SUM(ph.allocation_percent) AS total_allocation
    FROM portfolios p
    LEFT JOIN portfolio_holdings ph ON ph.portfolio_id = p.id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  db.query(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error", error: err.message });
    res.json(rows);
  });
};

// POST /api/portfolio - create a new portfolio
const createPortfolio = (req, res) => {
  const { name, total_value, risk_score } = req.body;
  if (!name) return res.status(400).json({ message: "Portfolio name required" });

  const sql = "INSERT INTO portfolios (user_id, name, total_value, risk_score) VALUES (?, ?, ?, ?)";
  db.query(sql, [req.user.id, name, total_value || 0, risk_score || 5], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error", error: err.message });
    res.status(201).json({ message: "Portfolio created", id: result.insertId });
  });
};

// GET /api/portfolio/:id/holdings - get holdings for a portfolio
const getHoldings = (req, res) => {
  const sql = `
    SELECT ph.*, a.ticker, a.name AS asset_name, a.sector, a.asset_type, a.esg_score
    FROM portfolio_holdings ph
    JOIN assets a ON a.id = ph.asset_id
    WHERE ph.portfolio_id = ?
  `;
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error", error: err.message });
    res.json(rows);
  });
};

// POST /api/portfolio/:id/holdings - add a holding
const addHolding = (req, res) => {
  const { asset_id, allocation_percent, quantity, purchase_price } = req.body;
  if (!asset_id) return res.status(400).json({ message: "asset_id required" });

  const sql = "INSERT INTO portfolio_holdings (portfolio_id, asset_id, allocation_percent, quantity, purchase_price) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [req.params.id, asset_id, allocation_percent || 0, quantity || 0, purchase_price || 0], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error", error: err.message });
    res.status(201).json({ message: "Holding added", id: result.insertId });
  });
};

// DELETE /api/portfolio/:id - delete portfolio
const deletePortfolio = (req, res) => {
  db.query("DELETE FROM portfolio_holdings WHERE portfolio_id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Server error" });
    db.query("DELETE FROM portfolios WHERE id = ? AND user_id = ?", [req.params.id, req.user.id], (err2) => {
      if (err2) return res.status(500).json({ message: "Server error" });
      res.json({ message: "Portfolio deleted" });
    });
  });
};

module.exports = { getPortfolios, createPortfolio, getHoldings, addHolding, deletePortfolio };
