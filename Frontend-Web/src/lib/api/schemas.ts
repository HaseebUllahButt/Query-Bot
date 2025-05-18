import api from "./client";
import { handleApiError } from "./errorHandler";
import { AxiosError } from "axios";

export interface Schema {
  _id: string;
  filename: string;
  content: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const getSchemas = async () => {
  try {
    const response = await api.get("/schemas");
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    return [];
  }
};

export const getSchema = async (id: string) => {
  const response = await api.get(`/schemas/${id}`);
  return response.data;
};

export const createSchema = async (data: {
  filename: string;
  content: string;
  description?: string;
}) => {
  const response = await api.post("/schemas", data);
  return response.data;
};

export const deleteSchema = async (id: string) => {
  const response = await api.delete(`/schemas/${id}`);
  return response.data;
};
