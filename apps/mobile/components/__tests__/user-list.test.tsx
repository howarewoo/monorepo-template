import { UserList } from "@/components/user-list";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

jest.mock("@/lib/api", () => ({
  apiClient: {
    users: {
      list: jest.fn(),
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { apiClient } = require("@/lib/api") as {
  apiClient: { users: { list: jest.Mock } };
};
const mockedList = apiClient.users.list;

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
    expect(screen.getByText("Loading users...")).toBeTruthy();
  });

  it("shows error message when API call fails", async () => {
    mockedList.mockRejectedValue(new Error("Network error"));
    render(<UserList />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/Failed to load users/)).toBeTruthy();
    });
  });

  it("shows empty message when no users returned", async () => {
    mockedList.mockResolvedValue([]);
    render(<UserList />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("No users found.")).toBeTruthy();
    });
  });

  it("renders user name, email, and ID", async () => {
    mockedList.mockResolvedValue([{ id: 1, name: "Alice", email: "alice@example.com" }]);
    render(<UserList />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeTruthy();
    });
    expect(screen.getByText("alice@example.com")).toBeTruthy();
    expect(screen.getByText("ID: 1")).toBeTruthy();
  });

  it("renders correct number of users", async () => {
    mockedList.mockResolvedValue([
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" },
      { id: 3, name: "Charlie", email: "charlie@example.com" },
    ]);
    render(<UserList />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeTruthy();
    });
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("Charlie")).toBeTruthy();
    expect(screen.getAllByText(/^ID: \d+$/)).toHaveLength(3);
  });
});
