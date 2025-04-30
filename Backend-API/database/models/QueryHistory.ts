import mongoose from "mongoose";

const queryHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schemaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchemaFile",
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

queryHistorySchema.index({ userId: 1, schemaId: 1, timestamp: -1 });
export const QueryHistory = mongoose.model("QueryHistory", queryHistorySchema);
