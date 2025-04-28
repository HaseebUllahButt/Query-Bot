"use client";
import { useState } from "react";
import axios from "axios";

export default function SchemaUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Set default name from file name if name is empty
      if (!name) {
        setName(e.target.files[0].name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file.");
      return;
    }
    if (!name) {
      setMessage("Please enter a name for the schema.");
      return;
    }
    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("description", description);

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/schemas/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("File uploaded successfully!");
      setFile(null);
      setName("");
      setDescription("");
    } catch (err: any) {
      setMessage(
        "Upload failed: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-indigo-700">
        Upload Schema File
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="file"
            accept=".sql,.json,.bson,.xml,.csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="w-full flex flex-col items-center px-4 py-6 bg-gray-50 text-gray-700 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
          >
            <svg
              className="w-8 h-8 mb-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <span className="text-sm font-medium">
              {file ? file.name : "Choose a file or drag and drop"}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              SQL, JSON, BSON, XML, CSV
            </span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Schema Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for your schema"
            className="block w-full rounded-md border-gray-300 bg-gray-100 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            placeholder="Enter a description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-md border-gray-300 bg-gray-100 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {message && (
        <div className="mt-4 text-center text-sm text-indigo-700">
          {message}
        </div>
      )}
    </div>
  );
}
