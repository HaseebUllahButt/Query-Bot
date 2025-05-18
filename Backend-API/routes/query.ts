import express from "express";
import { GeminiService } from "../services/llmService";
import { SchemaParser } from "../utils/schemaParser";
import { SchemaFile } from "../database/models/SchemaFile";
import { QueryHistory } from "../database/models/QueryHistory";
import { authenticate, isAuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const geminiService = new GeminiService();
const schemaParser = new SchemaParser();

// Get available schemas
router.get("/schemas", async (req, res) => {
  try {
    const schemas = await SchemaFile.find().select("_id filename description");
    res.json({ schemas });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch schemas" });
  }
});

// Convert natural language to SQL
router.post("/", authenticate, async (req, res) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    console.log("Received query request:", req.body);
    const { schemaId, query } = req.body;

    if (!schemaId || !query) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch schema from database
    const schemaFile = await SchemaFile.findById(schemaId);
    if (!schemaFile) {
      return res.status(404).json({ error: "Schema not found" });
    }

    // Parse the schema content
    const schema = await schemaParser.parseSchema(schemaFile.content);
    console.log("Using schema for query:", schema);

    // Generate SQL from the parsed schema and user query
    const sqlQuery = await geminiService.generateSQL(schema, query);
    console.log("Generated SQL query:", sqlQuery);

    // Store in history with user ID
    const historyEntry = await QueryHistory.create({
      userId: req.userId,
      schemaId,
      query,
      response: sqlQuery,
    });
    console.log("Created history entry:", historyEntry);

    // Set proper content type and send response
    res.setHeader("Content-Type", "application/json");
    res.json({
      sqlQuery,
      historyId: historyEntry._id,
    });
  } catch (error) {
    console.error("Query generation error:", error);
    res.status(500).json({
      error: "Failed to generate SQL query",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
