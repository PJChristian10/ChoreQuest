import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AvatarPicker } from "../AvatarPicker.js";

afterEach(() => {
  cleanup();
});

describe("AvatarPicker", () => {
  it("renders 12 avatar options", () => {
    render(<AvatarPicker selected={null} onSelect={vi.fn()} />);
    const options = screen.getAllByRole("radio");
    expect(options).toHaveLength(12);
  });

  it("has role='radiogroup' with aria-label 'Choose your avatar'", () => {
    render(<AvatarPicker selected={null} onSelect={vi.fn()} />);
    expect(screen.getByRole("radiogroup", { name: "Choose your avatar" })).toBeInTheDocument();
  });

  it("selected avatar has aria-checked='true'", () => {
    render(<AvatarPicker selected="cat" onSelect={vi.fn()} />);
    const catRadio = screen.getByRole("radio", { name: /cat/ });
    expect(catRadio).toHaveAttribute("aria-checked", "true");
  });

  it("unselected avatars have aria-checked='false'", () => {
    render(<AvatarPicker selected="cat" onSelect={vi.fn()} />);
    const dogRadio = screen.getByRole("radio", { name: /dog/ });
    expect(dogRadio).toHaveAttribute("aria-checked", "false");
  });

  it("no avatar is selected when selected=null", () => {
    render(<AvatarPicker selected={null} onSelect={vi.fn()} />);
    const options = screen.getAllByRole("radio");
    const checkedOptions = options.filter((o) => o.getAttribute("aria-checked") === "true");
    expect(checkedOptions).toHaveLength(0);
  });

  it("calls onSelect with the correct key when clicked", () => {
    const onSelect = vi.fn();
    render(<AvatarPicker selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("radio", { name: /lion/ }));
    expect(onSelect).toHaveBeenCalledWith("lion");
  });

  it("calls onSelect with 'dragon' when dragon avatar clicked", () => {
    const onSelect = vi.fn();
    render(<AvatarPicker selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("radio", { name: /dragon/ }));
    expect(onSelect).toHaveBeenCalledWith("dragon");
  });

  it("aria-label for each option includes the emoji and key", () => {
    render(<AvatarPicker selected={null} onSelect={vi.fn()} />);
    // Check a few specific ones
    expect(screen.getByRole("radio", { name: "🐱 cat" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "🐶 dog" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "🦄 unicorn" })).toBeInTheDocument();
  });
});
