import "./env-loader.js";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./register-routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import tryOnRouter from "./routes/try-on.js";

const app = express();
app.use(express.json({ limit: '50mb' }));  // Increased limit for image uploads
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
app.use(express.static('public'));

// Request processing middleware
app.use((req, res, next) => {
  next();
});

// Register API routes first
const server = registerRoutes(app);
app.use(tryOnRouter);

// API error handling middleware
app.use("/api", (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error Stack:', err.stack); // Log full stack trace
  console.error('API Error Message:', err.message);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Setup Vite or static file serving after API routes

// Start server function
const startServer = async () => {
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5001;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
};

// Only run header logic if not in Vercel environment (Vercel sets VERCEL=1)
if (process.env.VERCEL !== "1") {
  startServer().catch(console.error);
}

export default app;