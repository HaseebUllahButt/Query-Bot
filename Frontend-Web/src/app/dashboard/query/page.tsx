"use client";

import { useEffect, useState } from "react";
import QueryInterface from "@/app/components/query/QueryInterface";
import { Schema } from "@/types/schema";

export default function QueryPage() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token present:", !!token); // Debug token

        if (!token) {
          throw new Error("No authentication token found");
        }

        console.log("Fetching schemas...");
        const res = await fetch("http://localhost:5000/api/schemas", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include", // Include credentials
        });

        console.log("Response status:", res.status);
        const contentType = res.headers.get("content-type");
        console.log("Response content type:", contentType);

        if (!res.ok) {
          const errorData = await res.json();
          console.error("Error response:", errorData);
          throw new Error(errorData.error || "Failed to fetch schemas");
        }

        const data = await res.json();
        console.log("Received data:", data);

        setSchemas(Array.isArray(data) ? data : []);
        console.log("Set schemas:", Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching schemas:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch schemas"
        );
      }
    };

    fetchSchemas();
  }, []);

  // Debug render
  console.log("Rendering with schemas:", schemas);

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-bold mb-4 text-indigo-700">
          Natural Language to SQL
        </h1>
        <QueryInterface schemas={schemas} />
      </div>
    </div>
  );
}
