import SchemaUpload from "@/app/components/dashboard/schemas/upload";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-indigo-700">
          Upload Schema File
        </h1>
        <SchemaUpload />
      </div>
    </div>
  );
}
