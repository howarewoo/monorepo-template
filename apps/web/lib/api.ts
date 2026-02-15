import { createApiClient, createOrpcUtils } from "@infrastructure/api-client";
import type { Router } from "api/router";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const apiClient = createApiClient<Router>(API_URL);
export const orpc = createOrpcUtils(apiClient);
