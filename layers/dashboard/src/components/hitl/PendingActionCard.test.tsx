import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PendingActionCard, type PendingAction } from "./PendingActionCard";
import { renderWithI18n } from "@/test/render";

const action: PendingAction = {
  log_id: "log-001",
  action_id: "acq.lead.engage",
  stage: "ACQ",
  session_id: "session-abcdefgh",
  payload_in: {
    contact_id: "CID_042",
    reason: "New inbound lead",
    message: "Hello! Welcome to Exnoria.",
  },
  meta: { triggered_by: "acq.lead.score" },
  created_at: new Date().toISOString(),
  manual_action: false,
};

const noop = () => {};

function renderCard(overrides: Partial<Parameters<typeof PendingActionCard>[0]> = {}) {
  return renderWithI18n(
    <PendingActionCard
      action={action}
      isExpanded={false}
      isProcessing={false}
      edited={false}
      editedValue=""
      onToggleExpand={noop}
      onEditedChange={noop}
      onApprove={noop}
      onReject={noop}
      {...overrides}
    />
  );
}

describe("PendingActionCard", () => {
  it("renders action id, stage, contact, reasoning and reason", () => {
    renderCard();
    expect(screen.getByText("acq.lead.engage")).toBeInTheDocument();
    expect(screen.getByText("ACQ")).toBeInTheDocument();
    expect(screen.getByText("Contact:")).toBeInTheDocument();
    expect(screen.getByText("CID_042")).toBeInTheDocument();
    expect(screen.getByText("Reasoning:")).toBeInTheDocument();
    expect(screen.getByText("acq.lead.score")).toBeInTheDocument();
    expect(screen.getByText("Reason:")).toBeInTheDocument();
    expect(screen.getByText("New inbound lead")).toBeInTheDocument();
  });

  it("renders the full payload and meta when expanded", () => {
    renderCard({ isExpanded: true });
    expect(screen.getByText("Hide payload")).toBeInTheDocument();
    expect(
      screen.getByText((content, el) => el?.tagName === "PRE" && content.includes("CID_042"))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content, el) => el?.tagName === "PRE" && content.includes("triggered_by"))
    ).toBeInTheDocument();
  });

  it("forwards approve and reject through the action buttons", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onReject = vi.fn();
    renderCard({ onApprove, onReject });

    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("marks manual actions and skips the editable message field", () => {
    renderCard({ action: { ...action, manual_action: true, payload_in: { contact_id: "X" } } });
    expect(screen.getByText("MANUAL")).toBeInTheDocument();
    expect(screen.getByText("MANUAL ACTION")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
