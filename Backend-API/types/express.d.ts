import { Request } from "express";
import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      userId?: Types.ObjectId;
    }
  }
}

// This export is needed to make the file a module
export {};
