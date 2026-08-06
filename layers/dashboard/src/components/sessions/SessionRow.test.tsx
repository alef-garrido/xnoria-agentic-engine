import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionRow, type Session } from "./SessionRow";
import { renderWithI18n } from "@/test/render";

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }));
vi.mock("@/lib/client-api", () => ({ apiFetch: apiFetchMock }));

const baseSession: Session = {
  id: "sess-001",
  contact_id: "CID_001",
  channel: "Telegram",
  stage: "ACQ",
  input: "I need to know more about your pricing",
  actions_taken: 2,
  model: "qwen3-32b",
  created_at: new Date().toISOString(),
};

describe("SessionRow", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("renders channel, stage, contact and input", () => {
    renderWithI18n(<SessionRow session={baseSession} />);
    expect(screen.getByText("Telegram")).toBeInTheDocument();
    expect(screen.getByText("ACQ")).toBeInTheDocument();
    expect(screen.getByText("CID_001")).toBeInTheDocument();
    expect(screen.getByText('"I need to know more about your pricing"')).toBeInTheDocument();
    expect(screen.getByText("2 actions")).toBeInTheDocument();
  });

  it("truncates inputs longer than 80 characters", () => {
    const long = "x".repeat(100);
    renderWithI18n(<SessionRow session={{ ...baseSession, input: long }} />);
    expect(screen.getByText(`"${"x".repeat(80)}..."`)).toBeInTheDocument();
  });

  it("loads and renders history on expand", async () => {
    const user = userEvent.setup();
    apiFetchMock.mockResolvedValue({
      history: [
        { id: "m1", role: "user", content: "Hello there", created_at: new Date().toISOString() },
        {
          id: "m2",
          role: "assistant",
          content: "How can I help?",
          created_at: new Date().toISOString(),
        },
      ],
    });

    renderWithI18n(<SessionRow session={baseSession} />);
    await user.click(screen.getByText("Telegram"));

    expect(apiFetchMock).toHaveBeenCalledWith("/api/sessions/sess-001");
    expect(await screen.findByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("How can I help?")).toBeInTheDocument();
  });

  it("shows the empty-history state when history resolves empty", async () => {
    const user = userEvent.setup();
    apiFetchMock.mockResolvedValue({ history: [] });

    renderWithI18n(<SessionRow session={baseSession} />);
    await user.click(screen.getByText("Telegram"));

    expect(
      await screen.findByText("No history messages found for this session.")
    ).toBeInTheDocument();
  });
});
