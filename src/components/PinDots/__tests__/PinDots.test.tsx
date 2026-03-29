import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PinDots } from "../PinDots.js";

afterEach(() => {
  cleanup();
});

describe("PinDots", () => {
  it("renders 4 dots", () => {
    render(<PinDots length={0} />);
    const dots = screen.getAllByTestId("pin-dot");
    expect(dots).toHaveLength(4);
  });

  it("marks correct number of dots as filled when length=0", () => {
    render(<PinDots length={0} />);
    const dots = screen.getAllByTestId("pin-dot");
    const filledDots = dots.filter((d) => d.getAttribute("data-filled") === "true");
    expect(filledDots).toHaveLength(0);
  });

  it("marks correct number of dots as filled when length=2", () => {
    render(<PinDots length={2} />);
    const dots = screen.getAllByTestId("pin-dot");
    const filledDots = dots.filter((d) => d.getAttribute("data-filled") === "true");
    expect(filledDots).toHaveLength(2);
  });

  it("marks correct number of dots as filled when length=4", () => {
    render(<PinDots length={4} />);
    const dots = screen.getAllByTestId("pin-dot");
    const filledDots = dots.filter((d) => d.getAttribute("data-filled") === "true");
    expect(filledDots).toHaveLength(4);
  });

  it("marks empty dots with data-filled='false'", () => {
    render(<PinDots length={1} />);
    const dots = screen.getAllByTestId("pin-dot");
    const emptyDots = dots.filter((d) => d.getAttribute("data-filled") === "false");
    expect(emptyDots).toHaveLength(3);
  });

  it("has data-status='idle' by default", () => {
    render(<PinDots length={0} />);
    const container = screen.getByTestId("pin-dots");
    expect(container.getAttribute("data-status")).toBe("idle");
  });

  it("has data-status='error' when status='error'", () => {
    render(<PinDots length={4} status="error" />);
    const container = screen.getByTestId("pin-dots");
    expect(container.getAttribute("data-status")).toBe("error");
  });

  it("has data-status='success' when status='success'", () => {
    render(<PinDots length={4} status="success" />);
    const container = screen.getByTestId("pin-dots");
    expect(container.getAttribute("data-status")).toBe("success");
  });

  it("applies pinDotsError class when status='error'", () => {
    render(<PinDots length={4} status="error" />);
    const container = screen.getByTestId("pin-dots");
    expect(container.className).toMatch(/pinDotsError/);
  });

  it("applies pinDotsSuccess class when status='success'", () => {
    render(<PinDots length={4} status="success" />);
    const container = screen.getByTestId("pin-dots");
    expect(container.className).toMatch(/pinDotsSuccess/);
  });
});
