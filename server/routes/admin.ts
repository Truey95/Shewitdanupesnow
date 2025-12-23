import express, { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

const router = express.Router();

// Admin credentials from environment variables for security
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "TCFE",
  password: process.env.ADMIN_PASSWORD || "nupeonly"
};

// Use a stable secret for serverless environments where instances recycle frequently
// In production, ALWAYS set JWT_SECRET in environment variables
const JWT_SECRET = process.env.JWT_SECRET || "nupe-style-studio-stable-secret-key-2024";

// Admin login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    // Verify credentials
    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username, role: "admin" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      message: "Login successful"
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Verify admin token
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
});

// Get system statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    // Return system statistics
    res.json({
      success: true,
      data: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        apiCalls: {
          today: 1429,
          thisHour: 89
        },
        activeConnections: 12
      }
    });
  } catch (error) {
    console.error("Error getting system stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get system statistics"
    });
  }
});

export default router;