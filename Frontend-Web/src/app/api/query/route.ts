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

    const res = await fetch("http://localhost:5000/api/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("Authorization") || "",
      },
      body: JSON.stringify({ schemaId, query }),
    });

    // Clone the response before reading it
    const resClone = res.clone();

    try {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (e) {
      // If JSON parsing fails, try to get the text content from the clone
      const textContent = await resClone.text();
      console.error("Response parsing error. Raw response:", textContent);
      return NextResponse.json(
        { error: "Invalid response format from backend" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
