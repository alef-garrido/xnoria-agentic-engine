import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Zap } from "lucide-react";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("renders value and label", () => {
    render(<MetricCard icon={Zap} value={42} label="Active signals" />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Active signals")).toBeInTheDocument();
  });

  it("renders change with default positive color", () => {
    render(<MetricCard icon={Zap} value="12%" label="Conversion" change="+2.1%" />);
    expect(screen.getByText("+2.1%")).toHaveStyle({ color: "var(--positive)" });
  });

  it("applies the requested change color", () => {
    render(
      <MetricCard icon={Zap} value="3" label="Escalations" change="-1" changeColor="negative" />
    );
    expect(screen.getByText("-1")).toHaveStyle({ color: "var(--negative)" });
  });

  it("hides the change badge when not provided", () => {
    render(<MetricCard icon={Zap} value="10" label="Signals" />);
    expect(screen.queryByText("+2.1%")).not.toBeInTheDocument();
  });
});
