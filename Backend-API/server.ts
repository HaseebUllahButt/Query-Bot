import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./database/connection";
import authRoutes from "./routes/auth";
import schemaRoutes from "./routes/schema";
import queryRoutes from "./routes/query";
import { authenticate, isAuthenticatedRequest } from "./middleware/auth";
import meRouter from "./routes/me";
import dotenv from "dotenv";
import queryRouter from "./routes/query";

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const PORT = 5000;

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "API is running" });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Schema routes
app.use("/api/schemas", authenticate, schemaRoutes);

// Query routes
app.use("/api/query", authenticate, queryRoutes);
app.use("/query", queryRouter);

// Protected route example
app.get("/api/me", authenticate, async (req: Request, res: Response) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({ user: req.userId?.toString() });
  } catch (error) {
    console.error("Error in /me route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.use("/api/me", meRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
