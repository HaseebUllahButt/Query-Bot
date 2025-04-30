import express from "express";
import { QueryHistory } from "../database/models/QueryHistory";
import { authenticate, isAuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// Get history for a schema
router.get("/:schemaId", authenticate, async (req, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const { schemaId } = req.params;
    const history = await QueryHistory.find({
      userId: req.userId,
      schemaId,
    })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch query history" });
  }
});

// Store new query
router.post("/", authenticate, async (req, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    console.log("Received history creation request:", req.body);
    const { schemaId, query, response } = req.body;

    const newHistory = await QueryHistory.create({
      userId: req.userId,
      schemaId,
      query,
      response,
    });

    console.log("Created history entry:", newHistory);
    res.status(201).json(newHistory);
  } catch (error) {
    console.error("Error creating history:", error);
    res.status(500).json({ error: "Failed to store query history" });
  }
});

export default router;
