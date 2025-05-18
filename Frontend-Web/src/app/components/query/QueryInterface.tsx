"use client";

import { useState, useRef, useEffect } from "react";
import { Schema } from "@/types/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface QueryHistory {
  query: string;
  response: string;
  timestamp: Date;
}

interface QueryInterfaceProps {
  schemas: Schema[];
}

interface HistoryViewMode {
  type: "chat" | "history";
}

export default function QueryInterface({ schemas }: QueryInterfaceProps) {
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [viewMode, setViewMode] = useState<HistoryViewMode["type"]>("chat");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Debug logging for schemas prop
  useEffect(() => {
    console.log("Received schemas:", schemas);
  }, [schemas]);

  // Auto-scroll when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchHistory = async (schemaId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const res = await fetch(`http://localhost:5000/api/history/${schemaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Failed to fetch history" }));
        throw new Error(errorData.error || "Failed to fetch history");
      }

      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch history"
      );
    }
  };

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSchema || !input.trim()) {
      setError("Please select a schema and enter a question.");
      return;
    }

    const question = input.trim();
    setError("");
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // First, try to get the SQL query
      const queryRes = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schemaId: selectedSchema,
          query: question,
        }),
      });

      if (!queryRes.ok) {
        const errorData = await queryRes.json();
        throw new Error(errorData.error || "Failed to process query");
      }

      const responseData = await queryRes.json();

      // Add the SQL response to messages
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseData.sqlQuery },
      ]);

      // Refresh history after successful query
      await fetchHistory(selectedSchema);
    } catch (err) {
      console.error("Query error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle schema selection
  const handleSchemaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSchema = e.target.value;
    console.log("Selected schema:", newSchema);
    setSelectedSchema(newSchema);
    setMessages([]);
    if (newSchema) {
      fetchHistory(newSchema);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] max-w-xl mx-auto border rounded-lg overflow-auto shadow text-gray-700">
      {/* Schema selector */}
      <div className="p-3 bg-gray-100 border-b flex justify-between items-center">
        <select
          value={selectedSchema}
          onChange={handleSchemaChange}
          className="w-40 px-2 py-1 bg-white border rounded focus:outline-none text-sm text-gray-700"
        >
          <option value="">Select Schema</option>
          {schemas.map((s) => (
            <option key={s._id} value={s._id}>
              {s.filename}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("chat")}
            className={`px-3 py-1 rounded ${
              viewMode === "chat" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setViewMode("history")}
            className={`px-3 py-1 rounded ${
              viewMode === "history" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Display area */}
      {viewMode === "chat" ? (
        <div className="flex-1 p-4 bg-white overflow-auto text-gray-700">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-[70%] ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      ) : (
        <div className="flex-1 p-4 bg-white overflow-auto">
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item, idx) => (
                <div key={idx} className="border-b pb-2">
                  <p className="font-medium">Q: {item.query}</p>
                  <p className="text-gray-600">A: {item.response}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No history available</p>
          )}
        </div>
      )}

      {/* Input box */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-gray-100 border-t text-gray-700"
      >
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!selectedSchema || isLoading}
            placeholder={
              selectedSchema ? "Type your question..." : "Select a schema first"
            }
            className="flex-1 px-3 py-2 border rounded-l focus:outline-none text-sm text-gray-700 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!selectedSchema || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-r disabled:opacity-50 text-sm"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
