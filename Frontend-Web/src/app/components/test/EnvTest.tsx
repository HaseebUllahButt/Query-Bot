"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

export default function EnvTest() {
  useEffect(() => {
    // Check if environment variables are loaded
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    const googleKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!openaiKey) {
      toast.error("OpenAI API key not found in environment variables");
    } else {
      toast.success("OpenAI API key loaded successfully");
    }

    if (!anthropicKey) {
      toast.error("Anthropic API key not found in environment variables");
    } else {
      toast.success("Anthropic API key loaded successfully");
    }

    if (!googleKey) {
      toast.error("Google API key not found in environment variables");
    } else {
      toast.success("Google API key loaded successfully");
    }
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Environment Variables Test</h2>
      <div className="space-y-2">
        <p>
          OpenAI Key:{" "}
          {process.env.NEXT_PUBLIC_OPENAI_API_KEY
            ? "✅ Loaded"
            : "❌ Not Found"}
        </p>
        <p>
          Anthropic Key:{" "}
          {process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
            ? "✅ Loaded"
            : "❌ Not Found"}
        </p>
        <p>
          Google Key:{" "}
          {process.env.NEXT_PUBLIC_GOOGLE_API_KEY
            ? "✅ Loaded"
            : "❌ Not Found"}
        </p>
      </div>
    </div>
  );
}
