import { createTypedApiClient, createTypedOrpcUtils } from "@infrastructure/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const apiClient = createTypedApiClient(API_URL);
export const orpc = createTypedOrpcUtils(apiClient);
