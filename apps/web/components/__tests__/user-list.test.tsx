import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { UserList } from "@/components/user-list";

vi.mock("@/lib/api", () => ({
  apiClient: {
    users: {
      list: vi.fn(),
    },
  },
}));

import { apiClient } from "@/lib/api";

const mockedList = vi.mocked(apiClient.users.list);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("UserList", () => {
  it("shows loading state while fetching", () => {
    mockedList.mockReturnValue(new Promise(() => {}));
    render(<UserList />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading users...")).toBeDefined();
  });

  it("shows error message when API call fails", async () => {
    mockedList.mockRejectedValue(new Error("Network error"));
    render(<UserList />, { wrapper: createWrapper() });
    expect(await screen.findByText(/Failed to load users/)).toBeDefined();
  });

  it("shows empty message when no users returned", async () => {
    mockedList.mockResolvedValue([]);
    render(<UserList />, { wrapper: createWrapper() });
    expect(await screen.findByText("No users found.")).toBeDefined();
  });

  it("renders user name, email, and ID", async () => {
    mockedList.mockResolvedValue([
      { id: "1", name: "Alice", email: "alice@example.com", createdAt: "2024-01-01T00:00:00Z" },
    ]);
    render(<UserList />, { wrapper: createWrapper() });
    expect(await screen.findByText("Alice")).toBeDefined();
    expect(screen.getByText("alice@example.com")).toBeDefined();
    expect(screen.getByText("ID: 1")).toBeDefined();
  });

  it("renders correct number of user cards", async () => {
    mockedList.mockResolvedValue([
      { id: "1", name: "Alice", email: "alice@example.com", createdAt: "2024-01-01T00:00:00Z" },
      { id: "2", name: "Bob", email: "bob@example.com", createdAt: "2024-01-02T00:00:00Z" },
      { id: "3", name: "Charlie", email: "charlie@example.com", createdAt: "2024-01-03T00:00:00Z" },
    ]);
    render(<UserList />, { wrapper: createWrapper() });
    await screen.findByText("Alice");
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Charlie")).toBeDefined();
    expect(screen.getAllByText(/^ID: \d+$/)).toHaveLength(3);
  });
});
