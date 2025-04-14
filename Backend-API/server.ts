import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
dotenv.config({ path: ".env.local" });

import indexRoute from "./routes/indexRoute";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(helmet());

const PORT = 5000;

app.use("/", indexRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
