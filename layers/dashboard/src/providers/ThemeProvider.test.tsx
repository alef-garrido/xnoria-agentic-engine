import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { ThemeProvider, ThemeContext, THEME_STORAGE_KEY } from "@/providers/ThemeProvider";
import { useTheme } from "@/hooks/useTheme";

function ThemeProbe() {
  const { theme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setTheme("light")}>set-light</button>
    </div>
  );
}

function StandaloneProbe() {
  const value = useContext(ThemeContext);
  return <span data-testid="ctx">{value ? "provided" : "missing"}</span>;
}

describe("ThemeProvider", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
  });

  it("defaults to dark when no stored preference and system prefers dark", () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("follows a stored light preference", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("persists choice and applies the class on toggle", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");

    await user.click(screen.getByText("toggle"));

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("setTheme switches and persists explicitly", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );
    await user.click(screen.getByText("set-light"));
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("exposes context to consumers", () => {
    render(
      <ThemeProvider>
        <StandaloneProbe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("ctx")).toHaveTextContent("provided");
  });

  it("useTheme throws outside a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThemeProbe />)).toThrow("useTheme must be used within a ThemeProvider");
    spy.mockRestore();
  });
});
