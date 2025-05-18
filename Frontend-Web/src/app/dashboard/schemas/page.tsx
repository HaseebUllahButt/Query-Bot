import SchemaList from "@/app/components/schemas/SchemaList";

export default function SchemasPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-indigo-700">Your Schemas</h1>
      <SchemaList />
    </div>
  );
}
