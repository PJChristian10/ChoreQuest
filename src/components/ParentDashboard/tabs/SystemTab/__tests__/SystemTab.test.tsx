import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SystemTab } from "../SystemTab.js";
import { GameProvider } from "../../../../../state/GameContext.js";
import { SEED_STATE } from "../../../../../state/seed.js";

function renderSystemTab() {
  return render(
    <GameProvider initialState={SEED_STATE}>
      <SystemTab />
    </GameProvider>
  );
}

describe("SystemTab", () => {
  let clearSpy: ReturnType<typeof vi.spyOn>;
  let reloadSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearSpy = vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {});

    // window.location.reload is not configurable in jsdom — replace via Object.defineProperty
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: reloadSpy },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the Reset App button", () => {
    renderSystemTab();
    expect(screen.getByRole("button", { name: /reset app/i })).toBeInTheDocument();
  });

  it("modal is not shown initially", () => {
    renderSystemTab();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking Reset App opens the confirmation modal", () => {
    renderSystemTab();
    fireEvent.click(screen.getByRole("button", { name: /reset app/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/this cannot be undone/i)).toBeInTheDocument();
  });

  it("confirm button is disabled until 'RESET' is typed", () => {
    renderSystemTab();
    fireEvent.click(screen.getByRole("button", { name: /reset app/i }));
    const confirmBtn = screen.getByRole("button", { name: /confirm reset/i });
    expect(confirmBtn).toBeDisabled();
  });

  it("confirm button remains disabled for partial or wrong-case input", () => {
    renderSystemTab();
    fireEvent.click(screen.getByRole("button", { name: /reset app/i }));
    const input = screen.getByRole("textbox", { name: /type reset to confirm/i });
    const confirmBtn = screen.getByRole("button", { name: /confirm reset/i });

    fireEvent.change(input, { target: { value: "reset" } });
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: "RESE" } });
    expect(confirmBtn).toBeDisabled();
  });

  it("confirm button is enabled when 'RESET' is typed exactly", () => {
    renderSystemTab();
    fireEvent.click(screen.getByRole("button", { name: /reset app/i }));
    const input = screen.getByRole("textbox", { name: /type reset to confirm/i });
    fireEvent.change(input, { target: { value: "RESET" } });
    expect(screen.getByRole("button", { name: /confirm reset/i })).not.toBeDisabled();
  });

  it("cancel button closes the modal", () => {
    renderSystemTab();
    fireEvent.click(screen.getByRole("button", { name: /reset app/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirming calls localStorage.clear and window.location.reload", () => {
    renderSystemTab();
    fireEvent.click(screen.getByRole("button", { name: /reset app/i }));
    const input = screen.getByRole("textbox", { name: /type reset to confirm/i });
    fireEvent.change(input, { target: { value: "RESET" } });
    fireEvent.click(screen.getByRole("button", { name: /confirm reset/i }));
    expect(clearSpy).toHaveBeenCalledOnce();
    expect(reloadSpy).toHaveBeenCalledOnce();
  });
});
