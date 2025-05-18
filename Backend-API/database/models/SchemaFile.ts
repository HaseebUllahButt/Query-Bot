import mongoose, { Document } from "mongoose";

interface ISchemaFile extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  filePath: string;
  content: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schemaFileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true, // Index for faster queries by userId
  },
  filename: {
    type: String,
    required: true,
    trim: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
schemaFileSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create compound index for userId and filename to ensure unique filenames per user
schemaFileSchema.index({ userId: 1, filename: 1 }, { unique: true });

export const SchemaFile = mongoose.model<ISchemaFile>(
  "SchemaFile",
  schemaFileSchema
);
