import { Request, Response, NextFunction } from "express";
import { Session } from "../database/models/Session";
import { Types } from "mongoose";

// Define the authenticated request type
declare module "express" {
  interface Request {
    userId?: Types.ObjectId;
  }
}

// Type guard to check if a request is authenticated
export function isAuthenticatedRequest(
  req: Request
): req is Request & { userId: Types.ObjectId } {
  return req.userId instanceof Types.ObjectId;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const session = await Session.findOne({ token });

    if (!session) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ message: "Session expired" });
    }

    // Add userId to request
    req.userId = session.userId;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
