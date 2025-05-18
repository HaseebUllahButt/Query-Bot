import { GoogleGenerativeAI } from "@google/generative-ai";
import { Schema } from "../types/schema";

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    // Replace this with your actual Gemini API key
    const apiKey = "AIzaSyD651VD-7LanIMMtcfDED14a0lVb_or4FI";
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateSQL(schema: Schema, query: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });
      const prompt = this.buildPrompt(schema, query);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        // Remove markdown code block syntax if present
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        console.log("cleanText", cleanText);
        const jsonResponse = JSON.parse(cleanText);
        if (!jsonResponse.query || !jsonResponse.explanation) {
          throw new Error("Invalid response format");
        }
        return jsonResponse.query;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Invalid response format from AI");
      }
    } catch (error) {
      console.error("Error generating SQL:", error);
      throw new Error("Failed to generate SQL query");
    }
  }

  private buildPrompt(schema: Schema, query: string): string {
    const schemaDescription = this.formatSchema(schema);

    return `You are a SQL expert. Given the following database schema and a natural language query, generate a valid SQL query.

Database Name: ${schema.databaseName}
Database Schema:
${schemaDescription}

Instructions:
- You MUST use the database name "${schema.databaseName}" in your query.
- Always start your SQL query with "USE ${schema.databaseName};"
- Always use the most semantically relevant column for the user's question (e.g., use 'username' for user name queries, not 'user_id').
- If the user asks for a name, prefer columns like 'username', 'first_name', or 'last_name' over IDs.
- Do not use ID columns unless the question specifically asks for an ID.
- If there isn't a relevant column with the exact name (e.g., a user asks for a person named "harold" but we only have 'customers'), use the most suitable column instead.
- Return your response in the following JSON format:
{
  "explanation": "Brief explanation of what the query does",
  "query": "Your SQL query here"
}
- The query should be a complete, valid SQL statement.
- Never include phrases like "I am unable to" or "I cannot" in your response.
- Never include comments or additional text outside the JSON structure.

Natural Language Query: "${query}"
`;
  }

  private formatSchema(schema: Schema): string {
    let schemaText = "";

    // Format tables
    schema.tables.forEach((table) => {
      schemaText += `Table: ${table.name}\n`;
      schemaText += "Columns:\n";
      table.columns.forEach((column) => {
        schemaText += `  - ${column.name} (${column.type})`;
        if (column.constraints && column.constraints.length > 0) {
          schemaText += ` [${column.constraints.join(", ")}]`;
        }
        schemaText += "\n";
      });
      schemaText += "\n";
    });

    // Format relationships
    if (schema.relationships && schema.relationships.length > 0) {
      schemaText += "Relationships:\n";
      schema.relationships.forEach((rel) => {
        schemaText += `- ${rel.from} (${rel.type}) -> ${rel.to}\n`;
      });
    }

    return schemaText;
  }
}
