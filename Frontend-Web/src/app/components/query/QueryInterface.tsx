"use client";

import { useState, useRef, useEffect } from "react";
import { Schema } from "@/types/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
  queryStatus?: "pending" | "success" | "error";
}

interface QueryHistory {
  query: string;
  response: string;
  timestamp: Date;
}

type HistoryViewMode = {
  type: "chat" | "history";
};

interface ConnectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (username: string, password: string, port: string) => void;
}

const ConnectionPopup = ({
  isOpen,
  onClose,
  onConnect,
}: ConnectionPopupProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [port, setPort] = useState("3306");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(username, password, port);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Connect to MySQL</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Port</label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface QueryInterfaceProps {
  schemas: Schema[];
}

const RunButton = ({
  query,
  onRun,
  status,
}: {
  query: string;
  onRun: (query: string) => void;
  status?: "pending" | "success" | "error";
}) => {
  const getButtonStyle = () => {
    if (status === "success") return "bg-green-500 cursor-not-allowed";
    if (status === "error") return "bg-red-500 cursor-not-allowed";
    if (status === "pending") return "bg-gray-500 cursor-not-allowed";
    return "bg-blue-500 hover:bg-blue-600";
  };

  return (
    <button
      onClick={() => onRun(query)}
      disabled={status !== undefined}
      className={`mt-2 w-8 h-8 rounded-full flex items-center justify-center text-white ${getButtonStyle()}`}
      title={
        status === "pending"
          ? "Running..."
          : status === "success"
          ? "Success"
          : status === "error"
          ? "Error"
          : "Run Query"
      }
    >
      {status === "pending" ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : status === "success" ? (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : status === "error" ? (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
    </button>
  );
};

export default function QueryInterface({ schemas }: QueryInterfaceProps) {
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [viewMode, setViewMode] = useState<HistoryViewMode["type"]>("chat");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [queryStatuses, setQueryStatuses] = useState<{
    [key: number]: "pending" | "success" | "error";
  }>({});

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

  const handleConnect = async (
    username: string,
    password: string,
    port: string
  ) => {
    setIsPopupOpen(false);
    setConnectionStatus("connecting");

    try {
      const ws = new WebSocket("ws://localhost:7878");

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "handshake",
            username,
            password,
            port,
          })
        );
      };

      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (response.status === "success") {
          setConnectionStatus("connected");
          setWs(ws);
        } else {
          setConnectionStatus("error");
          ws.close();
        }
      };

      ws.onerror = () => {
        setConnectionStatus("error");
        ws.close();
      };

      ws.onclose = () => {
        if (connectionStatus === "connecting") {
          setConnectionStatus("error");
        }
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setConnectionStatus("error");
    }
  };

  const handleRunQuery = async (query: string, messageIndex: number) => {
    if (!ws || connectionStatus !== "connected") return;

    setQueryStatuses((prev) => ({ ...prev, [messageIndex]: "pending" }));

    try {
      ws.send(
        JSON.stringify({
          type: "query",
          query: query,
        })
      );
    } catch (error) {
      console.error("Error sending query:", error);
      setQueryStatuses((prev) => ({ ...prev, [messageIndex]: "error" }));
    }
  };

  // Update WebSocket message handler
  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (response.status === "success") {
          // Find the last assistant message and update its status
          const lastAssistantIndex = [...messages]
            .reverse()
            .findIndex((m) => m.role === "assistant");
          if (lastAssistantIndex !== -1) {
            const actualIndex = messages.length - 1 - lastAssistantIndex;
            setQueryStatuses((prev) => ({ ...prev, [actualIndex]: "success" }));
          }
        } else if (response.status === "error") {
          const lastAssistantIndex = [...messages]
            .reverse()
            .findIndex((m) => m.role === "assistant");
          if (lastAssistantIndex !== -1) {
            const actualIndex = messages.length - 1 - lastAssistantIndex;
            setQueryStatuses((prev) => ({ ...prev, [actualIndex]: "error" }));
          }
        }
      };
    }
  }, [ws, messages]);

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
                {msg.role === "assistant" &&
                  connectionStatus === "connected" && (
                    <RunButton
                      query={msg.content}
                      onRun={(query) => handleRunQuery(query, idx)}
                      status={queryStatuses[idx]}
                    />
                  )}
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

      <div className="mb-4">
        <button
          onClick={() => setIsPopupOpen(true)}
          className="px-4 ml-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Connect to Computer
        </button>
        <span className="ml-4">
          Status:
          <span
            className={`ml-2 ${
              connectionStatus === "connected"
                ? "text-green-600"
                : connectionStatus === "error"
                ? "text-red-600"
                : connectionStatus === "connecting"
                ? "text-yellow-600"
                : "text-gray-600"
            }`}
          >
            {connectionStatus.charAt(0).toUpperCase() +
              connectionStatus.slice(1)}
          </span>
        </span>
      </div>
      <ConnectionPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onConnect={handleConnect}
      />
    </div>
  );
}
