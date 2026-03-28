const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "hacktrix_secret_2024";

const generateToken = (id, email, role, risk_profile) => {
  return jwt.sign({ id, email, role, risk_profile }, JWT_SECRET, { expiresIn: "7d" });
};

// @POST /api/auth/register
const register = (req, res) => {
  const { name, email, password, role = "retail", risk_profile = "moderate" } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const sql = "INSERT INTO users (name, email, password_hash, role, risk_profile) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, email, hashedPassword, role, risk_profile], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY")
        return res.status(400).json({ message: "Email already exists" });
      return res.status(500).json({ message: "Server error", error: err.message });
    }
    const token = generateToken(result.insertId, email, role, risk_profile);
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: result.insertId, name, email, role, risk_profile },
    });
  });
};

// @POST /api/auth/login
const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user.id, user.email, user.role, user.risk_profile);
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, risk_profile: user.risk_profile },
    });
  });
};

// @GET /api/auth/profile
const getProfile = (req, res) => {
  db.query("SELECT id, name, email, role, risk_profile, created_at FROM users WHERE id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  });
};

module.exports = { register, login, getProfile };
