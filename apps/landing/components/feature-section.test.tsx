import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeatureSection } from "./feature-section";

const defaultProps = {
  number: "1.0",
  title: "Test Title",
  description: "Test description text",
  features: ["Feature A", "Feature B"],
  code: 'console.log("hello")',
  codeLabel: "test.ts",
};

describe("FeatureSection", () => {
  it("renders title and description", () => {
    render(<FeatureSection {...defaultProps} />);
    expect(screen.getByText("Test Title")).toBeTruthy();
    expect(screen.getByText("Test description text")).toBeTruthy();
  });

  it("renders feature pills", () => {
    render(<FeatureSection {...defaultProps} />);
    expect(screen.getByText("Feature A")).toBeTruthy();
    expect(screen.getByText("Feature B")).toBeTruthy();
  });

  it("renders code block with label", () => {
    render(<FeatureSection {...defaultProps} />);
    expect(screen.getByText("test.ts")).toBeTruthy();
    expect(screen.getByText('console.log("hello")')).toBeTruthy();
  });

  it("applies reverse layout when reverse prop is true", () => {
    const { container } = render(<FeatureSection {...defaultProps} reverse />);
    const flexContainer = container.querySelector(".lg\\:flex-row-reverse");
    expect(flexContainer).toBeTruthy();
  });

  it("does not apply reverse layout by default", () => {
    const { container } = render(<FeatureSection {...defaultProps} />);
    const flexContainer = container.querySelector(".lg\\:flex-row-reverse");
    expect(flexContainer).toBeNull();
  });
});
