import api from "./client";

export interface LLMProvider {
  name: string;
  id: string;
  available: boolean;
}

export interface QueryResponse {
  sqlQuery: string;
}

export const getAvailableLLMs = async (): Promise<LLMProvider[]> => {
  try {
    const response = await api.get("/query/llms");
    return response.data.llms;
  } catch (error) {
    console.error("Failed to fetch LLM providers:", error);
    return [];
  }
};

export const generateSQL = async (
  schemaId: string,
  query: string,
  llmProvider: string
): Promise<QueryResponse> => {
  try {
    const response = await api.post("/query", {
      schemaId,
      query,
      llmProvider,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to generate SQL:", error);
    throw error;
  }
};
