import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RewardManagementTab } from "../RewardManagementTab.js";
import { GameProvider } from "../../../../../state/GameContext.js";
import {
  makeGameState,
  makeReward,
  makeRedemption,
  makePlayer,
  makeActiveSession,
} from "../../../../../test/fixtures.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderRewardManagementTab(
  state = makeGameState({ parentSession: makeActiveSession() }),
  onSessionExpired = vi.fn()
) {
  return render(
    <GameProvider skipSync={true} initialState={state}>
      <RewardManagementTab onSessionExpired={onSessionExpired} />
    </GameProvider>
  );
}

describe("RewardManagementTab", () => {
  it("renders list of rewards", () => {
    const state = makeGameState({
      rewards: [
        makeReward({ id: "r1", title: "Screen Time" }),
        makeReward({ id: "r2", title: "Movie Night" }),
      ],
      parentSession: makeActiveSession(),
    });
    renderRewardManagementTab(state);
    expect(screen.getByText("Screen Time")).toBeInTheDocument();
    expect(screen.getByText("Movie Night")).toBeInTheDocument();
  });

  it("shows pending fulfillments section", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const reward = makeReward({ id: "r1", title: "Screen Time" });
    const redemption = makeRedemption({ id: "red1", rewardId: "r1", playerId: "p1", status: "pending" });
    const state = makeGameState({
      players: [player],
      rewards: [reward],
      redemptions: [redemption],
      parentSession: makeActiveSession(),
    });
    renderRewardManagementTab(state);
    expect(screen.getByText(/pending fulfillments/i)).toBeInTheDocument();
  });

  it("each pending fulfillment has a 'Mark Fulfilled' button", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const reward = makeReward({ id: "r1", title: "Screen Time" });
    const redemption = makeRedemption({ id: "red1", rewardId: "r1", playerId: "p1", status: "pending" });
    const state = makeGameState({
      players: [player],
      rewards: [reward],
      redemptions: [redemption],
      parentSession: makeActiveSession(),
    });
    renderRewardManagementTab(state);
    expect(
      screen.getByRole("button", { name: "Mark Screen Time for Alex fulfilled" })
    ).toBeInTheDocument();
  });

  it("clicking 'Mark Fulfilled' dispatches FULFILL_REDEMPTION", () => {
    const player = makePlayer({ id: "p1", name: "Alex" });
    const reward = makeReward({ id: "r1", title: "Screen Time" });
    const redemption = makeRedemption({ id: "red1", rewardId: "r1", playerId: "p1", status: "pending" });
    const state = makeGameState({
      players: [player],
      rewards: [reward],
      redemptions: [redemption],
      parentSession: makeActiveSession(),
    });
    renderRewardManagementTab(state);
    fireEvent.click(
      screen.getByRole("button", { name: "Mark Screen Time for Alex fulfilled" })
    );
    // Redemption should be fulfilled — button should be gone
    expect(
      screen.queryByRole("button", { name: "Mark Screen Time for Alex fulfilled" })
    ).not.toBeInTheDocument();
  });

  it("clicking 'Add New Reward' shows form", () => {
    renderRewardManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Add New Reward" }));
    expect(screen.getByRole("textbox", { name: "Reward title" })).toBeInTheDocument();
  });

  it("form has title, coin cost, stock inputs", () => {
    renderRewardManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Add New Reward" }));
    expect(screen.getByRole("textbox", { name: "Reward title" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Coin cost" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Stock quantity" })).toBeInTheDocument();
  });

  it("submitting form dispatches ADD_REWARD", () => {
    renderRewardManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Add New Reward" }));

    fireEvent.change(screen.getByRole("textbox", { name: "Reward title" }), {
      target: { value: "New Reward" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Coin cost" }), {
      target: { value: "50" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save reward" }));

    // Form hidden after save
    expect(screen.queryByRole("textbox", { name: "Reward title" })).not.toBeInTheDocument();
    // New reward appears in list
    expect(screen.getByText("New Reward")).toBeInTheDocument();
  });

  it("submit disabled when title is empty", () => {
    renderRewardManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Add New Reward" }));
    expect(screen.getByRole("button", { name: "Save reward" })).toBeDisabled();
  });

  it("clicking Delete removes the reward", () => {
    const state = makeGameState({
      rewards: [makeReward({ id: "r1", title: "Screen Time" })],
      parentSession: makeActiveSession(),
    });
    renderRewardManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Delete Screen Time" }));
    expect(screen.queryByText("Screen Time")).not.toBeInTheDocument();
  });
});

describe("RewardManagementTab — Browse Templates", () => {
  it("renders 'Browse Templates' button", () => {
    renderRewardManagementTab();
    expect(screen.getByRole("button", { name: "Browse Templates" })).toBeInTheDocument();
  });

  it("clicking 'Browse Templates' opens the template selector dialog", () => {
    renderRewardManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Browse Templates" }));
    expect(screen.getByRole("dialog", { name: /Browse Reward Templates/i })).toBeInTheDocument();
  });

  it("already-instantiated reward templates are pre-selected", () => {
    const state = makeGameState({
      rewards: [makeReward({ id: "r1", title: "Extra Screen Time (30 min)" })],
      parentSession: makeActiveSession(),
    });
    renderRewardManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Browse Templates" }));
    expect(
      screen.getByRole("button", { name: "Deselect reward: Extra Screen Time (30 min)" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("'Add Selected' dispatches ADD_REWARDS_BATCH with only non-duplicate rewards", () => {
    const state = makeGameState({
      rewards: [makeReward({ id: "r1", title: "Extra Screen Time (30 min)" })],
      parentSession: makeActiveSession(),
    });
    renderRewardManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Browse Templates" }));
    // Select a template not already in state
    fireEvent.click(screen.getByRole("button", { name: "Select reward: Special Dessert" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Selected rewards" }));
    // "Special Dessert" added; "Extra Screen Time (30 min)" still present exactly once
    expect(screen.getByText("Special Dessert")).toBeInTheDocument();
    expect(screen.getAllByText("Extra Screen Time (30 min)")).toHaveLength(1);
  });

  it("Cancel closes the template panel without dispatching", () => {
    renderRewardManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Browse Templates" }));
    expect(screen.getByRole("dialog", { name: /Browse Reward Templates/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel template browser" }));
    expect(screen.queryByRole("dialog", { name: /Browse Reward Templates/i })).not.toBeInTheDocument();
  });

  it("'Add Selected' dispatches nothing when all selected templates already exist", () => {
    const state = makeGameState({
      rewards: [makeReward({ id: "r1", title: "Extra Screen Time (30 min)" })],
      parentSession: makeActiveSession(),
    });
    renderRewardManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Browse Templates" }));
    // "Extra Screen Time (30 min)" is the only pre-selected template and already exists
    fireEvent.click(screen.getByRole("button", { name: "Add Selected rewards" }));
    // Modal closed, reward list unchanged
    expect(screen.queryByRole("dialog", { name: /Browse Reward Templates/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Extra Screen Time (30 min)")).toHaveLength(1);
  });
});
