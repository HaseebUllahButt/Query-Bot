"use client";

import { useState, useRef, useEffect } from "react";
import { Schema } from "@/types/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface QueryInterfaceProps {
  schemas: Schema[];
}

export default function QueryInterface({ schemas }: QueryInterfaceProps) {
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // auto‐scroll when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSchema || !input.trim()) {
      setError("Please select a schema and enter a question.");
      return;
    }
    const question = input.trim();
    setError("");
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemaId: selectedSchema, query: question }),
      });
      if (!res.ok) throw new Error("Failed to fetch response");
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.sqlQuery },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      setMessages(prev => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] max-w-xl mx-auto border rounded-lg overflow-auto shadow text-gray-700">
      {/* Schema selector */}
      <div className="p-3 bg-gray-100 border-b">
        <select
          value={selectedSchema}
          onChange={(e) => {
            setSelectedSchema(e.target.value);
            setMessages([]);
          }}
          className="w-40 px-2 py-1 bg-white border rounded focus:outline-none text-sm text-gray-700"
        >
          <option value="">Select Schema</option>
          {schemas.map((s) => (
            <option key={s._id} value={s._id}>
              {s.filename}
            </option>
          ))}
        </select>
      </div>

      {/* Chat history */}
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

      {/* Input box */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-gray-100 border-t text-gray-700"
      >
        {error && <div className="text-gray-600 mb-2 text-sm">{error}</div>}
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
