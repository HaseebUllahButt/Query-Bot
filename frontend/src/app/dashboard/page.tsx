import SchemaUpload from "@/app/components/dashboard/schemas/upload";

export default function DashboardPage() {
  return (
    <div className=" flex items-center justify-center">
      <div className="max-w-[100%] w-full flex justify-center rounded-xl">
        <SchemaUpload />
      </div>
    </div>
  );
}
