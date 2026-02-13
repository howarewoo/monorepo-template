import { createApiClient, createOrpcUtils } from "@repo/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const apiClient = createApiClient(API_URL);
export const orpc = createOrpcUtils(apiClient);
