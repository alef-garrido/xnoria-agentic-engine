import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionRow, type FilterAction } from "./ActionRow";
import { renderWithI18n } from "@/test/render";

const action: FilterAction = {
  id: "row-1",
  action_id: "sup.ticket.escalate",
  stage: "SUP",
  n8n_workflow_id: "sup-ticket-escalate",
  requires_hitl: false,
  manual_action: false,
  enabled: true,
  description: "Escalate unresolved ticket to senior support queue",
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
};

function renderRow(overrides: Partial<Parameters<typeof ActionRow>[0]> = {}) {
  return renderWithI18n(
    <ActionRow
      action={action}
      description={action.description ?? ""}
      deleting={false}
      onToggle={vi.fn()}
      onRequestDelete={vi.fn()}
      onCancelDelete={vi.fn()}
      onConfirmDelete={vi.fn()}
      {...overrides}
    />
  );
}

describe("ActionRow", () => {
  it("renders action id, stage, workflow and description", () => {
    renderRow();
    expect(screen.getByText("sup.ticket.escalate")).toBeInTheDocument();
    expect(screen.getByText("SUP")).toBeInTheDocument();
    expect(screen.getByText("sup-ticket-escalate")).toBeInTheDocument();
    expect(
      screen.getByText("Escalate unresolved ticket to senior support queue")
    ).toBeInTheDocument();
  });

  it("fires onToggle with the field and next value for each switch", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderRow({ onToggle });

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(3);

    await user.click(switches[0]); // requires_hitl: false -> true
    expect(onToggle).toHaveBeenCalledWith("requires_hitl", true);

    await user.click(switches[1]); // manual_action: false -> true
    expect(onToggle).toHaveBeenCalledWith("manual_action", true);

    await user.click(switches[2]); // enabled: true -> false
    expect(onToggle).toHaveBeenCalledWith("enabled", false);
  });

  it("walks through the delete confirmation flow", async () => {
    const user = userEvent.setup();
    const onConfirmDelete = vi.fn();

    function DeleteFlowHost() {
      const [deleting, setDeleting] = React.useState(false);
      return (
        <ActionRow
          action={action}
          description={action.description ?? ""}
          deleting={deleting}
          onToggle={vi.fn()}
          onRequestDelete={() => setDeleting(true)}
          onCancelDelete={() => setDeleting(false)}
          onConfirmDelete={onConfirmDelete}
        />
      );
    }

    renderWithI18n(<DeleteFlowHost />);

    // Trash (unnamed reload via aria) — fall back to the delete row cell.
    const trash = screen.getByRole("button", { name: "" });
    await user.click(trash);
    expect(onConfirmDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
  });
});
