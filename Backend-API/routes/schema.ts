import express, { Request, Response } from "express";
import { SchemaFile } from "../database/models/SchemaFile";
import { authenticate, isAuthenticatedRequest } from "../middleware/auth";
import { Types } from "mongoose";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // or use memoryStorage for buffer

// Helper function to generate unique filename
async function generateUniqueFilename(
  userId: Types.ObjectId,
  originalName: string
): Promise<string> {
  const baseName = path.parse(originalName).name;
  const extension = path.parse(originalName).ext;
  let counter = 1;
  let newName = originalName;

  while (true) {
    const existingSchema = await SchemaFile.findOne({
      userId,
      filename: newName,
    });
    if (!existingSchema) {
      break;
    }
    newName = `${baseName}[${counter}]${extension}`;
    counter++;
  }

  return newName;
}

// Upload new schema
router.post("/", authenticate, async (req: Request, res: Response) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const { filename, content, description } = req.body;

    if (!filename || !content) {
      return res
        .status(400)
        .json({ error: "Filename and content are required" });
    }

    const schemaFile = new SchemaFile({
      userId: req.userId,
      filename,
      content,
      description,
    });

    await schemaFile.save();
    res.status(201).json(schemaFile);
  } catch (error) {
    console.error("Error creating schema:", error);
    res.status(500).json({ error: "Failed to create schema" });
  }
});

// Get all schemas for the authenticated user
router.get("/", authenticate, async (req: Request, res: Response) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const schemas = await SchemaFile.find({ userId: req.userId })
      .select("-content") // Don't send content in list view
      .sort({ updatedAt: -1 });
    res.json(schemas);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch schemas" });
  }
});

// Get specific schema
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const schema = await SchemaFile.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!schema) {
      return res.status(404).json({ error: "Schema not found" });
    }

    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch schema" });
  }
});

// Delete schema
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const schema = await SchemaFile.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!schema) {
      return res.status(404).json({ error: "Schema not found" });
    }

    // Delete the file from uploads directory if it exists
    if (schema.filePath && fs.existsSync(schema.filePath)) {
      fs.unlinkSync(schema.filePath);
    }

    // Delete from database
    await SchemaFile.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    res.json({ message: "Schema deleted successfully" });
  } catch (error) {
    console.error("Error deleting schema:", error);
    res.status(500).json({ error: "Failed to delete schema" });
  }
});

// Upload schema file
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!req.body.name) {
      return res.status(400).json({ error: "Schema name is required" });
    }

    const { originalname, path: filePath } = req.file;
    const content = fs.readFileSync(filePath, "utf-8");

    // Generate unique filename using the provided name
    const uniqueFilename = await generateUniqueFilename(
      req.userId,
      req.body.name
    );

    const schemaFile = new SchemaFile({
      userId: req.userId,
      filename: uniqueFilename,
      filePath: filePath,
      content,
      description: req.body.description || "",
    });

    await schemaFile.save();
    res.status(201).json({ message: "Schema uploaded", schema: schemaFile });
  }
);

export default router;
