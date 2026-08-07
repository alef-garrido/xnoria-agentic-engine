import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { StatusBar } from "./StatusBar";
import { renderWithI18n } from "@/test/render";

const { usePollingMock } = vi.hoisted(() => ({ usePollingMock: vi.fn() }));

vi.mock("@/hooks/usePolling", () => ({ usePolling: usePollingMock }));
vi.mock("@/lib/client-api", () => ({ apiFetch: vi.fn() }));

describe("StatusBar", () => {
  beforeEach(() => {
    usePollingMock.mockReset();
    usePollingMock.mockReturnValue({ data: null });
  });

  it("renders default stats while polling has not resolved", () => {
    renderWithI18n(<StatusBar />);
    expect(screen.getAllByText("0%")).toHaveLength(2); // CPU + DISK
    expect(screen.getByText("0.0/4GB")).toBeInTheDocument();
    expect(screen.getByText("SVC: 0/4")).toBeInTheDocument();
    expect(screen.getByText("Uptime: 0d 0h")).toBeInTheDocument();
  });

  it("renders polled stats when data arrives", () => {
    usePollingMock.mockReturnValue({
      data: {
        cpu: 72.4,
        ram: { used: 3.2, total: 8 },
        disk: { used: 41, total: 100 },
        activeServices: 3,
        totalServices: 6,
        uptime: "12d 4h",
      },
    });
    renderWithI18n(<StatusBar />);
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("3.2/8GB")).toBeInTheDocument();
    expect(screen.getByText("41%")).toBeInTheDocument();
    expect(screen.getByText("SVC: 3/6")).toBeInTheDocument();
    expect(screen.getByText("Uptime: 12d 4h")).toBeInTheDocument();
  });
});
