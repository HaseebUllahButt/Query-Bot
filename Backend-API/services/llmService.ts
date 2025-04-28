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

      // Extract SQL query from the response
      const sqlMatch = text.match(/```sql\n([\s\S]*?)\n```/);
      if (!sqlMatch) {
        throw new Error("No SQL query found in the response");
      }

      return sqlMatch[1].trim();
    } catch (error) {
      console.error("Error generating SQL:", error);
      throw new Error("Failed to generate SQL query");
    }
  }

  private buildPrompt(schema: Schema, query: string): string {
    const schemaDescription = this.formatSchema(schema);

    return `You are a SQL expert. Given the following database schema and a natural language query, generate a valid SQL query.

Database Schema:
${schemaDescription}

Instructions:
- Always use the most semantically relevant column for the user's question (e.g., use 'username' for user name queries, not 'user_id').
- If the user asks for a name, prefer columns like 'username', 'first_name', or 'last_name' over IDs.
- Do not use ID columns unless the question specifically asks for an ID.
- if there isnt a relevant colum with that exact name for eg: a user asks for person named "harold" but we only have customers you use the most suitable column in this case customers.
- Return only the SQL query wrapped in \`\`\`sql tags. Do not include any explanations or additional text.

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
