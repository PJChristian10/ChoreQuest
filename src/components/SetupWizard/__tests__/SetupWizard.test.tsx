import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import { SetupWizard } from "../SetupWizard.js";
import { GameProvider, useGameState } from "../../../state/GameContext.js";
import { SEED_STATE } from "../../../state/seed.js";

// hashPin is async (bcrypt) — stub it to keep tests fast
vi.mock("../../../services/authService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../services/authService.js")>();
  return {
    ...actual,
    hashPin: vi.fn(async (pin: string) => `hashed:${pin}`),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Wrap with GameProvider using empty players state
function renderWizard(onComplete = vi.fn(), onParentPortal = vi.fn()) {
  const emptyState = { ...SEED_STATE, players: [] };
  return render(
    <GameProvider skipSync={true} initialState={emptyState}>
      <SetupWizard onComplete={onComplete} onParentPortal={onParentPortal} />
    </GameProvider>
  );
}

// ---------------------------------------------------------------------------
// State-capture helper for dispatch verification tests
// ---------------------------------------------------------------------------

let capturedQuestCount = 0;
let capturedRewardCount = 0;

function StateCapturer() {
  const state = useGameState();
  capturedQuestCount = state.quests.length;
  capturedRewardCount = state.rewards.length;
  return null;
}

function renderWizardWithCapture(onComplete = vi.fn(), onParentPortal = vi.fn()) {
  capturedQuestCount = 0;
  capturedRewardCount = 0;
  const emptyState = { ...SEED_STATE, players: [], quests: [], rewards: [] };
  return render(
    <GameProvider skipSync={true} initialState={emptyState}>
      <StateCapturer />
      <SetupWizard onComplete={onComplete} onParentPortal={onParentPortal} />
    </GameProvider>
  );
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

// Helper to advance through step 2 (PIN creation)
async function completeStep2() {
  // Step 2 — create parent PIN
  // Enter PIN: 1234
  for (const digit of ["1", "2", "3", "4"]) {
    fireEvent.click(screen.getByRole("button", { name: `Digit ${digit}` }));
  }
  // Confirm PIN: 1234
  await waitFor(() => {
    expect(screen.getByText(/Confirm your PIN/i)).toBeInTheDocument();
  });
  for (const digit of ["1", "2", "3", "4"]) {
    fireEvent.click(screen.getByRole("button", { name: `Digit ${digit}` }));
  }
}

// Helper to click through the choice step to "Add Players Now"
async function completeChoiceStep() {
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Set up player profiles/i })).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole("button", { name: /Set up player profiles/i }));
}

// Helper to add a player and advance to the quest-selection step
async function advanceToQuestStep() {
  fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
  await act(async () => { await completeStep2(); });
  await completeChoiceStep();
  await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));
  const nameInput = screen.getByRole("textbox", { name: /Player name/i });
  fireEvent.change(nameInput, { target: { value: "Alex" } });
  fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
  await waitFor(() => screen.getByText("Alex"));
  fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));
  await waitFor(() => screen.getByRole("heading", { name: /Choose Your Starting Quests/i }));
}

describe("SetupWizard", () => {
  it("renders welcome screen on step 1", () => {
    renderWizard();
    expect(screen.getByRole("heading", { name: /Welcome to ChoreQuest!/i })).toBeInTheDocument();
  });

  it("'Get started' button advances to step 2", () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    expect(screen.getByRole("heading", { name: /Create Parent PIN/i })).toBeInTheDocument();
  });

  it("step 2 shows 'Create Parent PIN' heading", () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    expect(screen.getByRole("heading", { name: /Create Parent PIN/i })).toBeInTheDocument();
  });

  it("after step 2 the choice step appears with both options", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Parent PIN Set!/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Go to Parent Portal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Set up player profiles/i })).toBeInTheDocument();
  });

  it("'Go to Parent Portal' button calls onParentPortal", async () => {
    const onParentPortal = vi.fn();
    renderWizard(vi.fn(), onParentPortal);
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Go to Parent Portal/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Go to Parent Portal/i }));
    expect(onParentPortal).toHaveBeenCalledTimes(1);
  });

  it("'Add Players Now' in choice step advances to Add Players", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await completeChoiceStep();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Add Players/i })).toBeInTheDocument();
    });
  });

  it("back button on choice step returns to PIN step", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Parent PIN Set!/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Back$/i }));
    expect(screen.getByRole("heading", { name: /Create Parent PIN/i })).toBeInTheDocument();
  });

  it("can add a player in the players step", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await completeChoiceStep();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Add Players/i })).toBeInTheDocument();
    });

    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));

    await waitFor(() => {
      expect(screen.getByText("Alex")).toBeInTheDocument();
    });
  });

  it("Next is disabled in players step when no players added", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await completeChoiceStep();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Add Players/i })).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /Done adding players/i });
    expect(nextButton).toBeDisabled();
  });

  it("shows 'Choose Your Starting Quests' heading after adding a player", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await completeChoiceStep();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Add Players/i })).toBeInTheDocument();
    });

    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Choose Your Starting Quests/i })).toBeInTheDocument();
    });
  });

  it("skip button in quests step advances to rewards step", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));
    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Choose Your Starting Quests/i }));

    fireEvent.click(screen.getByRole("button", { name: /Skip adding quests/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Set Up Your Reward Shop/i })).toBeInTheDocument();
    });
  });

  it("shows 'Set Up Your Reward Shop' heading after skipping quests", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));
    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Choose Your Starting Quests/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skip adding quests/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Set Up Your Reward Shop/i })).toBeInTheDocument();
    });
  });

  it("skip button in rewards step advances to done screen", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));
    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Choose Your Starting Quests/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skip adding quests/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Set Up Your Reward Shop/i }));

    fireEvent.click(screen.getByRole("button", { name: /Skip adding rewards/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /You're all set!/i })).toBeInTheDocument();
    });
  });

  it("done screen shows 'You're all set!'", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));
    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Choose Your Starting Quests/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skip adding quests/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Set Up Your Reward Shop/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skip adding rewards/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /You're all set!/i })).toBeInTheDocument();
    });
  });

  it("'Let's Go!' calls onComplete", async () => {
    const onComplete = vi.fn();
    renderWizard(onComplete);
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));
    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Choose Your Starting Quests/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skip adding quests/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Set Up Your Reward Shop/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skip adding rewards/i }));
    await waitFor(() => screen.getByRole("button", { name: /Start ChoreQuest/i }));

    fireEvent.click(screen.getByRole("button", { name: /Start ChoreQuest/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  // --- Additional coverage tests ---

  it("back button on step 2 returns to step 1", () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    expect(screen.getByRole("heading", { name: /Create Parent PIN/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Back to welcome/i }));
    expect(screen.getByRole("heading", { name: /Welcome to ChoreQuest!/i })).toBeInTheDocument();
  });

  it("mismatched PINs in step 2 shows error and resets", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));

    // Enter first PIN: 1234
    for (const digit of ["1", "2", "3", "4"]) {
      fireEvent.click(screen.getByRole("button", { name: `Digit ${digit}` }));
    }
    await waitFor(() => expect(screen.getByText(/Confirm your PIN/i)).toBeInTheDocument());

    // Enter different PIN: 5678
    for (const digit of ["5", "6", "7", "8"]) {
      fireEvent.click(screen.getByRole("button", { name: `Digit ${digit}` }));
    }

    await waitFor(() => {
      expect(screen.getByText(/PINs don't match, try again/i)).toBeInTheDocument();
    });
    // Should reset back to "Enter a 4-digit PIN"
    expect(screen.getByText(/Enter a 4-digit PIN/i)).toBeInTheDocument();
  });

  it("back button on players step returns to choice step", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => {
      await completeStep2();
    });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));

    const backButtons = screen.getAllByRole("button", { name: /^Back$/i });
    fireEvent.click(backButtons[0]);
    expect(screen.getByRole("heading", { name: /Parent PIN Set!/i })).toBeInTheDocument();
  });

  it("can select and deselect quest templates (Make Your Bed starts selected)", async () => {
    renderWizard();
    await advanceToQuestStep();

    const makeBedButton = screen.getByRole("button", { name: /Make Your Bed/i });
    // Starts selected by default (in DEFAULT_QUEST_IDS)
    expect(makeBedButton).toHaveAttribute("aria-pressed", "true");
    // Deselect
    fireEvent.click(makeBedButton);
    expect(makeBedButton).toHaveAttribute("aria-pressed", "false");
    // Re-select
    fireEvent.click(makeBedButton);
    expect(makeBedButton).toHaveAttribute("aria-pressed", "true");
  });

  it("can proceed via Next with default quest selections", async () => {
    renderWizard();
    await advanceToQuestStep();

    // Default templates are pre-selected (≥ 3); Next is available immediately
    const nextBtn = screen.getByRole("button", { name: /^Next$/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Set Up Your Reward Shop/i })).toBeInTheDocument();
    });
  });

  it("can select and add rewards via Next", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => { await completeStep2(); });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));
    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Choose Your Starting Quests/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skip adding quests/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Set Up Your Reward Shop/i }));

    // Extra Screen Time (30 min) starts selected (DEFAULT_REWARD_IDS); Next is available
    const nextBtn = screen.getByRole("button", { name: /^Next$/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /You're all set!/i })).toBeInTheDocument();
    });
  });

  it("can toggle reward templates on and off (Extra Screen Time 30 min starts selected)", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => { await completeStep2(); });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));
    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Choose Your Starting Quests/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skip adding quests/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Set Up Your Reward Shop/i }));

    const screenTimeBtn = screen.getByRole("button", { name: /Extra Screen Time \(30 min\)/i });
    // Starts selected (in DEFAULT_REWARD_IDS)
    expect(screenTimeBtn).toHaveAttribute("aria-pressed", "true");
    // Deselect
    fireEvent.click(screenTimeBtn);
    expect(screenTimeBtn).toHaveAttribute("aria-pressed", "false");
    // Re-select
    fireEvent.click(screenTimeBtn);
    expect(screenTimeBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("can set optional player PIN in players step", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => { await completeStep2(); });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));

    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });

    // Click digits 1-4 for the player PIN
    fireEvent.click(screen.getByRole("button", { name: "Digit 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Digit 4" }));

    // Try adding a 5th digit (should be ignored due to PIN_LENGTH guard)
    fireEvent.click(screen.getByRole("button", { name: "Digit 5" }));

    // Check backspace works on player pin numpad
    fireEvent.click(screen.getByRole("button", { name: "Backspace" }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("Alex")).toBeInTheDocument();
    });
  });

  it("player PIN section does NOT render an input element showing PIN digits", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => { await completeStep2(); });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));

    expect(screen.queryByRole("textbox", { name: /Player PIN \(optional\)/i })).not.toBeInTheDocument();
  });

  it("PinDots component IS rendered in the player PIN section", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => { await completeStep2(); });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));

    const dots = document.querySelectorAll("[data-filled]");
    expect(dots.length).toBeGreaterThan(0);
  });

  it("NumPad IS rendered in the player PIN section when setting a PIN", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => { await completeStep2(); });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));

    expect(screen.getByRole("button", { name: "Digit 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Digit 0" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// New Phase 5 tests
// ---------------------------------------------------------------------------

describe("SetupWizard — quest selection step", () => {
  it("shows 'Choose Your Starting Quests' heading", async () => {
    renderWizard();
    await advanceToQuestStep();
    expect(screen.getByRole("heading", { name: /Choose Your Starting Quests/i })).toBeInTheDocument();
  });

  it("shows the quest step subheading", async () => {
    renderWizard();
    await advanceToQuestStep();
    expect(screen.getByText(/Pick the chores that fit your family/i)).toBeInTheDocument();
  });

  it("quest step renders the QuestTemplateSelector", async () => {
    renderWizard();
    await advanceToQuestStep();
    // QuestTemplateSelector renders Select All / Clear All buttons
    expect(screen.getByRole("button", { name: /select all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument();
  });

  it("default quest selections are pre-populated from DEFAULT_QUEST_IDS", async () => {
    renderWizard();
    await advanceToQuestStep();
    // Make Your Bed is in DEFAULT_QUEST_IDS (defaultSelected: true)
    expect(
      screen.getByRole("button", { name: /Make Your Bed/i }).getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("Next button is disabled when fewer than 3 quests are selected", async () => {
    renderWizard();
    await advanceToQuestStep();
    // Clear all selections first
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    // Select 2 quests
    fireEvent.click(screen.getByRole("button", { name: /Make Your Bed/i }));
    fireEvent.click(screen.getByRole("button", { name: /Brush Teeth/i }));
    expect(screen.getByRole("button", { name: /^Next$/i })).toBeDisabled();
  });

  it("Next button is enabled when exactly 3 quests are selected", async () => {
    renderWizard();
    await advanceToQuestStep();
    // Clear all, then select exactly 3
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    fireEvent.click(screen.getByRole("button", { name: /Make Your Bed/i }));
    fireEvent.click(screen.getByRole("button", { name: /Brush Teeth/i }));
    fireEvent.click(screen.getByRole("button", { name: /Set the Table/i }));
    expect(screen.getByRole("button", { name: /^Next$/i })).not.toBeDisabled();
  });

  it("Next button is enabled with default selections (8 quests selected)", async () => {
    renderWizard();
    await advanceToQuestStep();
    // Defaults give 8 selected → should not be disabled
    expect(screen.getByRole("button", { name: /^Next$/i })).not.toBeDisabled();
  });

  it("Skip for now in quest step clears selection and advances to reward step", async () => {
    renderWizard();
    await advanceToQuestStep();
    fireEvent.click(screen.getByRole("button", { name: /Skip adding quests/i }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Set Up Your Reward Shop/i })).toBeInTheDocument();
    });
  });
});

describe("SetupWizard — reward selection step", () => {
  async function advanceToRewardStep() {
    renderWizard();
    await advanceToQuestStep();
    fireEvent.click(screen.getByRole("button", { name: /Skip adding quests/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Set Up Your Reward Shop/i }));
  }

  it("shows 'Set Up Your Reward Shop' heading", async () => {
    await advanceToRewardStep();
    expect(screen.getByRole("heading", { name: /Set Up Your Reward Shop/i })).toBeInTheDocument();
  });

  it("shows the reward step subheading", async () => {
    await advanceToRewardStep();
    expect(screen.getByText(/Give your kids something to work toward/i)).toBeInTheDocument();
  });

  it("reward step renders the RewardTemplateSelector", async () => {
    await advanceToRewardStep();
    // RewardTemplateSelector renders Select All / Clear All buttons
    expect(screen.getByRole("button", { name: /select all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument();
  });

  it("default reward selections are pre-populated from DEFAULT_REWARD_IDS", async () => {
    await advanceToRewardStep();
    // Extra Screen Time (30 min) is in DEFAULT_REWARD_IDS
    expect(
      screen.getByRole("button", { name: /Extra Screen Time \(30 min\)/i }).getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("Skip for now in reward step advances to done screen", async () => {
    await advanceToRewardStep();
    fireEvent.click(screen.getByRole("button", { name: /Skip adding rewards/i }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /You're all set!/i })).toBeInTheDocument();
    });
  });

  it("Next button is available on reward step regardless of selection count", async () => {
    await advanceToRewardStep();
    // Clear all rewards
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    // Next should still be enabled (no minimum for rewards)
    expect(screen.getByRole("button", { name: /^Next$/i })).not.toBeDisabled();
  });
});

describe("SetupWizard — batch dispatch on completion", () => {
  it("completing with default selections dispatches ADD_QUESTS_BATCH and ADD_REWARDS_BATCH", async () => {
    const onComplete = vi.fn();
    renderWizardWithCapture(onComplete);

    // Navigate to quest step
    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => { await completeStep2(); });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));
    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Choose Your Starting Quests/i }));

    // Click Next (defaults are pre-selected)
    fireEvent.click(screen.getByRole("button", { name: /^Next$/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Set Up Your Reward Shop/i }));

    // Click Next (defaults are pre-selected)
    fireEvent.click(screen.getByRole("button", { name: /^Next$/i }));
    await waitFor(() => screen.getByRole("button", { name: /Start ChoreQuest/i }));

    fireEvent.click(screen.getByRole("button", { name: /Start ChoreQuest/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(capturedQuestCount).toBeGreaterThan(0);
    expect(capturedRewardCount).toBeGreaterThan(0);
  });

  it("completing with both skipped does not dispatch any batch actions", async () => {
    const onComplete = vi.fn();
    renderWizardWithCapture(onComplete);

    fireEvent.click(screen.getByRole("button", { name: /Get started/i }));
    await act(async () => { await completeStep2(); });
    await completeChoiceStep();
    await waitFor(() => screen.getByRole("heading", { name: /Add Players/i }));
    const nameInput = screen.getByRole("textbox", { name: /Player name/i });
    fireEvent.change(nameInput, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));
    await waitFor(() => screen.getByText("Alex"));
    fireEvent.click(screen.getByRole("button", { name: /Done adding players/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Choose Your Starting Quests/i }));

    // Skip both
    fireEvent.click(screen.getByRole("button", { name: /Skip adding quests/i }));
    await waitFor(() => screen.getByRole("heading", { name: /Set Up Your Reward Shop/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skip adding rewards/i }));
    await waitFor(() => screen.getByRole("button", { name: /Start ChoreQuest/i }));

    fireEvent.click(screen.getByRole("button", { name: /Start ChoreQuest/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(capturedQuestCount).toBe(0);
    expect(capturedRewardCount).toBe(0);
  });
});
