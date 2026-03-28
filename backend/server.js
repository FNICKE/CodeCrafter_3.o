const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// DB connection
require("./src/config/db");

const authRoutes = require("./src/routes/auth");
const portfolioRoutes = require("./src/routes/portfolio");
const researchRoutes = require("./src/routes/research");
const alertRoutes = require("./src/routes/alerts");
const marketRoutes = require("./src/routes/market");
const stockRoutes = require("./src/routes/stock");
const recommendationRoutes = require("./src/routes/recommendation");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make io accessible from routes
app.set("io", io);

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
