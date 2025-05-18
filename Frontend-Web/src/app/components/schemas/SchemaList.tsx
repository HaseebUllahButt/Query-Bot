"use client";

import { useState, useEffect } from "react";
import { getSchemas, deleteSchema, Schema } from "@/lib/api/schemas";
import toast from "react-hot-toast";

export default function SchemaList() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemas();
  }, []);

  const fetchSchemas = async () => {
    try {
      const data = await getSchemas();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setSchemas(data);
      } else if (data && Array.isArray(data.schemas)) {
        setSchemas(data.schemas);
      } else if (data && data.message) {
        // Handle the case where the backend returns a message object
        console.log("Backend message:", data.message);
        setSchemas([]);
      } else {
        console.error("Unexpected getSchemas response:", data);
        setSchemas([]);
      }
    } catch (error) {
      toast.error("Failed to fetch schemas");
      setSchemas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSchema(id);
      toast.success("Schema deleted successfully");
      fetchSchemas();
    } catch (error) {
      toast.error("Failed to delete schema");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {schemas.map((schema) => (
        <div
          key={schema._id}
          className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
        >
          <h3 className="text-lg font-bold text-indigo-700">
            {schema.filename}
          </h3>
          <p className="text-gray-500">{schema.description}</p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleDelete(schema._id)}
              className="text-red-600 hover:text-red-800 font-semibold"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
