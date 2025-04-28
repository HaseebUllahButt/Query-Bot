import express from "express";
import { GeminiService } from "../services/llmService";
import { SchemaParser } from "../utils/schemaParser";
import { SchemaFile } from "../database/models/SchemaFile";

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
router.post("/", async (req, res) => {
  try {
    console.log("Received body:", req.body);
    const { schemaId, query } = req.body;

    if (!schemaId || !query) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch schema from database
    const schemaFile = await SchemaFile.findById(schemaId);
    console.log("Schema file found:", schemaFile);
    if (!schemaFile) {
      return res.status(404).json({ error: "Schema not found" });
    }

    // Parse the schema content
    const schema = await schemaParser.parseSchema(schemaFile.content);
    console.log("Parsed schema:", schema);

    // Generate SQL from the parsed schema and user query
    const sqlQuery = await geminiService.generateSQL(schema, query);
    console.log("Generated SQL:", sqlQuery);

    res.json({ sqlQuery });
  } catch (error) {
    console.error("Query generation error:", error);
    res.status(500).json({
      error: "Failed to generate SQL query",
      details: (error as Error).message,
    });
  }
});

export default router;
