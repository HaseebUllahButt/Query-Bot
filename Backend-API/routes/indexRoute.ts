import express, { Router } from "express";
import meRouter from "./me";

const router: Router = express.Router();

router.get("/", (req, res) => {
  res.send("<h1>Query Bot</h1><p>Backend API - Version 1.0</p>");
});

export default router;
