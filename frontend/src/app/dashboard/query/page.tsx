import QueryInterface from "@/app/components/query/QueryInterface";

export default async function QueryPage() {
  // Fetch available schemas
  const res = await fetch("http://localhost:5000/query/schemas", {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch schemas");
  }
  const data = await res.json();
  const schemas = data.schemas || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-indigo-700">
          Natural Language to SQL
        </h1>
        <QueryInterface schemas={schemas} />
      </div>
    </div>
  );
}
