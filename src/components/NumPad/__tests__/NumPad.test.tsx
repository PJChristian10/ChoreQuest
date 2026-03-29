import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
import { NumPad } from "../NumPad.js";

describe("NumPad", () => {
  it("renders all 10 digit buttons (0-9)", () => {
    render(<NumPad onDigit={vi.fn()} onBackspace={vi.fn()} />);
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole("button", { name: `Digit ${i}` })).toBeInTheDocument();
    }
  });

  it("renders a backspace button", () => {
    render(<NumPad onDigit={vi.fn()} onBackspace={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Backspace" })).toBeInTheDocument();
  });

  it("calls onDigit with correct digit when a digit button is pressed", () => {
    const onDigit = vi.fn();
    render(<NumPad onDigit={onDigit} onBackspace={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Digit 5" }));
    expect(onDigit).toHaveBeenCalledWith("5");
  });

  it("calls onDigit with '0' when 0 button is pressed", () => {
    const onDigit = vi.fn();
    render(<NumPad onDigit={onDigit} onBackspace={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Digit 0" }));
    expect(onDigit).toHaveBeenCalledWith("0");
  });

  it("calls onBackspace when backspace button is pressed", () => {
    const onBackspace = vi.fn();
    render(<NumPad onDigit={vi.fn()} onBackspace={onBackspace} />);
    fireEvent.click(screen.getByRole("button", { name: "Backspace" }));
    expect(onBackspace).toHaveBeenCalledTimes(1);
  });

  it("all buttons have disabled attribute when disabled=true", () => {
    render(<NumPad onDigit={vi.fn()} onBackspace={vi.fn()} disabled={true} />);
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole("button", { name: `Digit ${i}` })).toBeDisabled();
    }
    expect(screen.getByRole("button", { name: "Backspace" })).toBeDisabled();
  });

  it("buttons are not disabled when disabled is not provided", () => {
    render(<NumPad onDigit={vi.fn()} onBackspace={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Digit 1" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Backspace" })).not.toBeDisabled();
  });

  it("buttons are not disabled when disabled=false", () => {
    render(<NumPad onDigit={vi.fn()} onBackspace={vi.fn()} disabled={false} />);
    expect(screen.getByRole("button", { name: "Digit 3" })).not.toBeDisabled();
  });

  it("does not call onDigit when disabled and digit pressed", () => {
    const onDigit = vi.fn();
    render(<NumPad onDigit={onDigit} onBackspace={vi.fn()} disabled={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Digit 7" }));
    expect(onDigit).not.toHaveBeenCalled();
  });

  it("does not call onBackspace when disabled and backspace pressed", () => {
    const onBackspace = vi.fn();
    render(<NumPad onDigit={vi.fn()} onBackspace={onBackspace} disabled={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Backspace" }));
    expect(onBackspace).not.toHaveBeenCalled();
  });
});
