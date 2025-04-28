import EnvTest from "@/app/components/test/EnvTest";

export default function TestPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-indigo-700">
        Environment Variables Test
      </h1>
      <EnvTest />
    </div>
  );
}
