import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  buttonVariants,
} from "../index";

describe("@infrastructure/ui-web exports", () => {
  it("exports Button component", () => {
    const { container } = render(<Button>Click</Button>);
    expect(container.querySelector("[data-slot='button']")).toBeTruthy();
  });

  it("exports buttonVariants", () => {
    expect(typeof buttonVariants).toBe("function");
  });

  it("exports Card and sub-components", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(container.querySelector("[data-slot='card']")).toBeTruthy();
    expect(container.querySelector("[data-slot='card-header']")).toBeTruthy();
    expect(container.querySelector("[data-slot='card-title']")).toBeTruthy();
    expect(container.querySelector("[data-slot='card-description']")).toBeTruthy();
    expect(container.querySelector("[data-slot='card-action']")).toBeTruthy();
    expect(container.querySelector("[data-slot='card-content']")).toBeTruthy();
    expect(container.querySelector("[data-slot='card-footer']")).toBeTruthy();
  });
});
