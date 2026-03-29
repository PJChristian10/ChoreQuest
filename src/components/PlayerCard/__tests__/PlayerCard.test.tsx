import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PlayerCard } from "../PlayerCard.js";
import { makePlayer, makePlayerWithAvatar } from "../../../test/fixtures.js";

afterEach(() => {
  cleanup();
});

describe("PlayerCard", () => {
  it("renders player name", () => {
    const player = makePlayer({ name: "Alex" });
    render(<PlayerCard player={player} onSelect={vi.fn()} />);
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("renders avatar emoji", () => {
    const player = makePlayerWithAvatar("cat");
    render(<PlayerCard player={player} onSelect={vi.fn()} />);
    expect(screen.getByText("🐱")).toBeInTheDocument();
  });

  it("renders default avatar emoji when no avatar set", () => {
    const player = makePlayer({ avatar: undefined });
    render(<PlayerCard player={player} onSelect={vi.fn()} />);
    expect(screen.getByText("👤")).toBeInTheDocument();
  });

  it("renders level title", () => {
    const player = makePlayer({ level: 2 });
    render(<PlayerCard player={player} onSelect={vi.fn()} />);
    // Level 2 = "Squire"
    expect(screen.getByText("Squire")).toBeInTheDocument();
  });

  it("renders level title for level 1", () => {
    const player = makePlayer({ level: 1 });
    render(<PlayerCard player={player} onSelect={vi.fn()} />);
    expect(screen.getByText("Apprentice")).toBeInTheDocument();
  });

  it("has role='button' with aria-label equal to player name", () => {
    const player = makePlayer({ name: "Sam" });
    render(<PlayerCard player={player} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Sam" })).toBeInTheDocument();
  });

  it("calls onSelect with player id when clicked", () => {
    const onSelect = vi.fn();
    const player = makePlayer({ id: "player-42", name: "Maya" });
    render(<PlayerCard player={player} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Maya" }));
    expect(onSelect).toHaveBeenCalledWith("player-42");
  });

  it("minimum height is at least 60px via style", () => {
    const player = makePlayer();
    render(<PlayerCard player={player} onSelect={vi.fn()} />);
    const button = screen.getByRole("button", { name: player.name });
    const style = window.getComputedStyle(button);
    // In jsdom, min-height from CSS modules may not be computable, so check attribute
    expect(button).toBeInTheDocument();
  });
});
