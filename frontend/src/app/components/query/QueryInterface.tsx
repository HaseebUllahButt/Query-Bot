"use client";

import { useState } from "react";
import { Schema } from "@/types/schema";
import QueryResult from "./QueryResult";

interface QueryInterfaceProps {
  schemas: Schema[];
}

export default function QueryInterface({ schemas }: QueryInterfaceProps) {
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<string>("");

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchema || !query) {
      setError("Please select a schema and enter a query");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemaId: selectedSchema, query }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate SQL query");
      }

      const data = await response.json();
      setResult(data.sqlQuery);
    } catch (error) {
      console.error("Frontend API error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleQuerySubmit} className="space-y-5">
        <div>
          <label
            htmlFor="schema"
            className="block text-sm font-semibold text-gray-800"
          >
            Select Schema
          </label>
          <select
            id="schema"
            value={selectedSchema}
            onChange={(e) => setSelectedSchema(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-gray-600"
          >
            <option value="">Choose a schema</option>
            {schemas.map((schema) => (
              <option key={schema._id} value={schema._id}>
                {schema.filename}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="query"
            className="block text-sm font-semibold text-gray-800"
          >
            Enter Your Question
          </label>
          <textarea
            id="query"
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Show me all customers who made purchases in the last month"
            className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-gray-600"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:opacity-50 transition"
        >
          {isLoading ? "Generating SQL..." : "Generate SQL"}
        </button>
      </form>

      {error && (
        <div className="flex items-start space-x-2 border-l-4 border-red-600 bg-red-50 p-4 rounded-md">
          <span className="text-red-600 font-bold">Error:</span>
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-4">
          <QueryResult sqlQuery={result} />
        </div>
      )}
    </div>
  );
}
