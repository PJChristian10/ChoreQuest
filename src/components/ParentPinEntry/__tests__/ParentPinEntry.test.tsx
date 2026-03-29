import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import { ParentPinEntry } from "../ParentPinEntry.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderParentPinEntry(
  verifyPin = vi.fn().mockResolvedValue(false),
  onSuccess = vi.fn(),
  onCancel = vi.fn()
) {
  return render(
    <ParentPinEntry
      onSuccess={onSuccess}
      onCancel={onCancel}
      verifyPin={verifyPin}
    />
  );
}

describe("ParentPinEntry", () => {
  it("renders 'Parent Access' heading", () => {
    renderParentPinEntry();
    expect(screen.getByText("Parent Access")).toBeInTheDocument();
  });

  it("renders a NumPad", () => {
    renderParentPinEntry();
    expect(screen.getByRole("button", { name: "Digit 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Digit 0" })).toBeInTheDocument();
  });

  it("renders PinDots (at least the PIN display area)", () => {
    renderParentPinEntry();
    // PinDots renders with data-testid="pin-dots"
    expect(screen.getByTestId("pin-dots")).toBeInTheDocument();
  });

  it("renders Cancel button", () => {
    renderParentPinEntry();
    expect(screen.getByRole("button", { name: "Cancel parent PIN entry" })).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    renderParentPinEntry(undefined, undefined, onCancel);
    fireEvent.click(screen.getByRole("button", { name: "Cancel parent PIN entry" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onSuccess when correct PIN entered", async () => {
    const verifyPin = vi.fn().mockResolvedValue(true);
    const onSuccess = vi.fn();
    renderParentPinEntry(verifyPin, onSuccess);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    }, { timeout: 1500 });
  });

  it("does not call onSuccess when incorrect PIN entered", async () => {
    const verifyPin = vi.fn().mockResolvedValue(false);
    const onSuccess = vi.fn();
    renderParentPinEntry(verifyPin, onSuccess);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
      fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    });

    await waitFor(() => {
      expect(verifyPin).toHaveBeenCalledWith("1234");
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
