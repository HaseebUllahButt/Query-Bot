import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { schemaId, query } = await request.json();

    if (!schemaId || !query) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const res = await fetch("http://localhost:5000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schemaId, query }),
    });

    if (!res.ok) {
      let errorMsg = "Unknown error";
      try {
        const errorData = await res.json();
        errorMsg = errorData.error || JSON.stringify(errorData);
      } catch (e) {
        errorMsg = await res.text();
      }
      console.error("Backend error:", errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
