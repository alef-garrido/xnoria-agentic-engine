import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "./SectionHeader";

describe("SectionHeader", () => {
  it("renders the section label", () => {
    render(<SectionHeader label="Journey Overview" />);
    expect(screen.getByText("Journey Overview")).toBeInTheDocument();
  });
});
