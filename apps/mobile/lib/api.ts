import { createApiClient, createOrpcUtils } from "@infrastructure/api-client";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:3001/api";

export const apiClient = createApiClient(API_URL);
export const orpc = createOrpcUtils(apiClient);
