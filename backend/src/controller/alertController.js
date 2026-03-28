const db = require("../config/db");

// GET /api/alerts
const getAlerts = (req, res) => {
  const sql = `
    SELECT al.*, a.ticker, a.name AS asset_name
    FROM alerts al
    LEFT JOIN assets a ON a.id = al.asset_id
    WHERE al.user_id = ?
    ORDER BY al.id DESC
  `;
  db.query(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error", error: err.message });
    res.json(rows);
  });
};

// POST /api/alerts
const createAlert = (req, res) => {
  const { asset_id, alert_type, threshold_value } = req.body;
  if (!asset_id || !alert_type)
    return res.status(400).json({ message: "asset_id and alert_type required" });

  const sql = "INSERT INTO alerts (user_id, asset_id, alert_type, threshold_value) VALUES (?, ?, ?, ?)";
  db.query(sql, [req.user.id, asset_id, alert_type, threshold_value || 0], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error", error: err.message });

    // Notify via socket
    const io = req.app.get("io");
    if (io) {
      io.emit("alert_created", {
        user_id: req.user.id,
        alert_id: result.insertId,
        alert_type,
        asset_id,
        threshold_value,
      });
    }
    res.status(201).json({ message: "Alert created", id: result.insertId });
  });
};

// DELETE /api/alerts/:id
const deleteAlert = (req, res) => {
  db.query(
    "DELETE FROM alerts WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Alert not found" });
      res.json({ message: "Alert deleted" });
    }
  );
};

// PUT /api/alerts/:id/toggle
const toggleAlert = (req, res) => {
  const sql = "UPDATE alerts SET is_active = NOT is_active WHERE id = ? AND user_id = ?";
  db.query(sql, [req.params.id, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });
    res.json({ message: "Alert toggled" });
  });
};

module.exports = { getAlerts, createAlert, deleteAlert, toggleAlert };
