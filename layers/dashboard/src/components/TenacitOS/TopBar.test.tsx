import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { TopBar } from "./TopBar";
import { renderWithI18n } from "@/test/render";

vi.mock("@/config/branding", () => ({
  BRANDING: {
    agentName: "Acme Agent",
    agentEmoji: "🧠",
    subtitle: "North Region",
  },
}));

describe("TopBar", () => {
  it("renders agent name, subtitle pill, version badge and admin label", () => {
    renderWithI18n(<TopBar />);
    expect(screen.getByText("Acme Agent")).toBeInTheDocument();
    expect(screen.getByText("North Region")).toBeInTheDocument();
    expect(screen.getByText("v1.0")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});
