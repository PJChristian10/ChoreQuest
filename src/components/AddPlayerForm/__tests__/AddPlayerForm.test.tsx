import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { AddPlayerForm } from "../AddPlayerForm.js";

vi.mock("../../../services/authService.js", () => ({
  hashPin: vi.fn(async (pin: string) => `hashed:${pin}`),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AddPlayerForm", () => {
  it("renders a name input", () => {
    render(<AddPlayerForm onAdd={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Player name" })).toBeInTheDocument();
  });

  it("renders the Add Player button disabled when name is empty", () => {
    render(<AddPlayerForm onAdd={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Add Player" })).toBeDisabled();
  });

  it("enables Add Player button when name is filled", () => {
    render(<AddPlayerForm onAdd={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Player name" }), {
      target: { value: "Sam" },
    });
    expect(screen.getByRole("button", { name: "Add Player" })).toBeEnabled();
  });

  it("calls onAdd with a player containing the entered name", async () => {
    const onAdd = vi.fn();
    render(<AddPlayerForm onAdd={onAdd} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Player name" }), {
      target: { value: "Sam" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Player" }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({ name: "Sam" });
  });

  it("new player starts with zero xp, coins, streak, level 1", async () => {
    const onAdd = vi.fn();
    render(<AddPlayerForm onAdd={onAdd} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Player name" }), {
      target: { value: "Sam" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Player" }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    const player = onAdd.mock.calls[0][0];
    expect(player.xp).toBe(0);
    expect(player.coins).toBe(0);
    expect(player.streak).toBe(0);
    expect(player.level).toBe(1);
    expect(player.badges).toEqual([]);
  });

  it("resets the name input after a successful add", async () => {
    render(<AddPlayerForm onAdd={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "Player name" });
    fireEvent.change(input, { target: { value: "Sam" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Player" }));
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("does not render Cancel button when onCancel is not provided", () => {
    render(<AddPlayerForm onAdd={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancel add player" })).not.toBeInTheDocument();
  });

  it("renders Cancel button when onCancel is provided", () => {
    render(<AddPlayerForm onAdd={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cancel add player" })).toBeInTheDocument();
  });

  it("clicking Cancel calls onCancel", () => {
    const onCancel = vi.fn();
    render(<AddPlayerForm onAdd={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel add player" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders the optional PIN section", () => {
    render(<AddPlayerForm onAdd={vi.fn()} />);
    expect(screen.getByText("Set optional PIN for this player")).toBeInTheDocument();
  });

  it("renders avatar picker", () => {
    render(<AddPlayerForm onAdd={vi.fn()} />);
    expect(screen.getByRole("radiogroup", { name: "Choose your avatar" })).toBeInTheDocument();
  });
});
