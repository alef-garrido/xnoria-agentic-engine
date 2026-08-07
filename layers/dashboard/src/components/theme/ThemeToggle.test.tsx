import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ThemeProvider, THEME_STORAGE_KEY } from "@/providers/ThemeProvider";
import { renderWithI18n } from "@/test/render";

describe("ThemeToggle", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
  });

  it("renders a switch reflecting the active theme", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderWithI18n(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    const sw = screen.getByRole("switch", { name: "Switch to light theme" });
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("returns checked=false when the light theme is active", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    renderWithI18n(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    const sw = screen.getByRole("switch", { name: "Switch to dark theme" });
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("toggles the theme and persists the choice", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderWithI18n(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    const sw = screen.getByRole("switch", { name: "Switch to light theme" });
    expect(sw).toHaveAttribute("aria-checked", "true");

    await user.click(sw);

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByRole("switch", { name: "Switch to dark theme" })).toHaveAttribute(
      "aria-checked",
      "false"
    );
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });
});
