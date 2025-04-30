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
