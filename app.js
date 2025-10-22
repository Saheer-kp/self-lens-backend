const express = require("express");
require("dotenv").config();
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");

// const redisDB = require("./config/redis");
const userRoutes = require("./routes/userRoutes");
const imageRoutes = require("./routes/imageRoutes");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use("/uploads", express.static("public/uploads"));

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/images", imageRoutes);

app.use(errorHandler);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Self Lens API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// // Error handler
// app.use((err, req, res, next) => {
//   console.error("Error:", err);
//   res.status(500).json({
//     success: false,
//     message: "Internal server error",
//   });
// });

module.exports = app;
