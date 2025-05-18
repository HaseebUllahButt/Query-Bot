import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./database/connection";
import authRoutes from "./routes/auth";
import schemaRoutes from "./routes/schema";
import queryRoutes from "./routes/query";
import queryHistoryRouter from "./routes/queryHistory";
import meRouter from "./routes/me";
import { authenticate } from "./middleware/auth";

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

const PORT = process.env.PORT || 5000;

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "API is running" });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/schemas", authenticate, schemaRoutes);
app.use("/api/query", authenticate, queryRoutes);
app.use("/api/history", authenticate, queryHistoryRouter);
app.use("/api/me", authenticate, meRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
