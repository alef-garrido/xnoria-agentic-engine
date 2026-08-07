import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionButtons } from "./ActionButtons";
import { renderWithI18n } from "@/test/render";

describe("ActionButtons", () => {
  it("fires approve and reject callbacks", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onReject = vi.fn();

    renderWithI18n(
      <ActionButtons
        isManual={false}
        isProcessing={false}
        onApprove={onApprove}
        onReject={onReject}
      />
    );

    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons while processing", () => {
    renderWithI18n(
      <ActionButtons isManual={false} isProcessing onApprove={vi.fn()} onReject={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
  });

  it("labels the approve action as Mark Complete for manual actions", () => {
    renderWithI18n(
      <ActionButtons isManual isProcessing={false} onApprove={vi.fn()} onReject={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Mark Complete" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });
});
