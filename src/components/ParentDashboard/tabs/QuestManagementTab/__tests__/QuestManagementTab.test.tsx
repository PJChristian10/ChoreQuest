import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QuestManagementTab } from "../QuestManagementTab.js";
import { GameProvider } from "../../../../../state/GameContext.js";
import {
  makeGameState,
  makeQuest,
  makeActiveSession,
  makeExpiredSession,
} from "../../../../../test/fixtures.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderQuestManagementTab(
  state = makeGameState({ parentSession: makeActiveSession() }),
  onSessionExpired = vi.fn()
) {
  return render(
    <GameProvider skipSync={true} initialState={state}>
      <QuestManagementTab onSessionExpired={onSessionExpired} />
    </GameProvider>
  );
}

describe("QuestManagementTab", () => {
  it("renders list of quests", () => {
    const state = makeGameState({
      quests: [
        makeQuest({ id: "q1", title: "Wash Dishes" }),
        makeQuest({ id: "q2", title: "Vacuum" }),
      ],
      parentSession: makeActiveSession(),
    });
    renderQuestManagementTab(state);
    expect(screen.getByText("Wash Dishes")).toBeInTheDocument();
    expect(screen.getByText("Vacuum")).toBeInTheDocument();
  });

  it("each quest shows title and recurrence", () => {
    const state = makeGameState({
      quests: [makeQuest({ id: "q1", title: "Wash Dishes", recurrence: "daily" })],
      parentSession: makeActiveSession(),
    });
    renderQuestManagementTab(state);
    expect(screen.getByText("Wash Dishes")).toBeInTheDocument();
    expect(screen.getByText(/daily/i)).toBeInTheDocument();
  });

  it("clicking 'Add New Quest' shows the form", () => {
    renderQuestManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Add New Quest" }));
    expect(screen.getByRole("textbox", { name: "Quest title" })).toBeInTheDocument();
  });

  it("form has title, XP, coin, difficulty, recurrence inputs", () => {
    renderQuestManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Add New Quest" }));
    expect(screen.getByRole("textbox", { name: "Quest title" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "XP reward" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Coin reward" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Difficulty" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Recurrence" })).toBeInTheDocument();
  });

  it("submit is disabled when title is empty", () => {
    renderQuestManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Add New Quest" }));
    expect(screen.getByRole("button", { name: "Save quest" })).toBeDisabled();
  });

  it("submitting form with valid data dispatches ADD_QUEST", () => {
    renderQuestManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Add New Quest" }));

    fireEvent.change(screen.getByRole("textbox", { name: "Quest title" }), {
      target: { value: "New Quest" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "XP reward" }), {
      target: { value: "25" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Coin reward" }), {
      target: { value: "15" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save quest" }));

    // After form submit, form should be hidden
    expect(screen.queryByRole("textbox", { name: "Quest title" })).not.toBeInTheDocument();
    // New quest should appear in list
    expect(screen.getByText("New Quest")).toBeInTheDocument();
  });

  it("clicking Delete dispatches DELETE_QUEST", () => {
    const state = makeGameState({
      quests: [makeQuest({ id: "q1", title: "Wash Dishes" })],
      parentSession: makeActiveSession(),
    });
    renderQuestManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Delete Wash Dishes" }));
    expect(screen.queryByText("Wash Dishes")).not.toBeInTheDocument();
  });

  it("active toggle dispatches UPDATE_QUEST with toggled isActive", () => {
    const quest = makeQuest({ id: "q1", title: "Wash Dishes", isActive: true });
    const state = makeGameState({
      quests: [quest],
      parentSession: makeActiveSession(),
    });
    renderQuestManagementTab(state);
    fireEvent.click(screen.getByRole("checkbox", { name: "Toggle Wash Dishes active" }));
    // Quest should now be inactive — button should reflect this
    const toggle = screen.getByRole("checkbox", { name: "Toggle Wash Dishes active" });
    expect(toggle).not.toBeChecked();
  });

  it("form cancel hides the form", () => {
    renderQuestManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Add New Quest" }));
    expect(screen.getByRole("textbox", { name: "Quest title" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel quest form" }));
    expect(screen.queryByRole("textbox", { name: "Quest title" })).not.toBeInTheDocument();
  });

  it("Delete calls onSessionExpired when session is expired", () => {
    const state = makeGameState({
      quests: [makeQuest({ id: "q1", title: "Wash Dishes" })],
      parentSession: makeExpiredSession(),
    });
    const onSessionExpired = vi.fn();
    renderQuestManagementTab(state, onSessionExpired);
    fireEvent.click(screen.getByRole("button", { name: "Delete Wash Dishes" }));
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});

describe("QuestManagementTab — Browse Templates", () => {
  it("renders 'Browse Templates' button", () => {
    renderQuestManagementTab();
    expect(screen.getByRole("button", { name: "Browse Templates" })).toBeInTheDocument();
  });

  it("clicking 'Browse Templates' opens the template selector dialog", () => {
    renderQuestManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Browse Templates" }));
    expect(screen.getByRole("dialog", { name: /Browse Quest Templates/i })).toBeInTheDocument();
  });

  it("already-instantiated quest templates are pre-selected", () => {
    const state = makeGameState({
      quests: [makeQuest({ id: "q1", title: "Make Your Bed" })],
      parentSession: makeActiveSession(),
    });
    renderQuestManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Browse Templates" }));
    expect(
      screen.getByRole("button", { name: "Deselect quest: Make Your Bed" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("'Add Selected' dispatches ADD_QUESTS_BATCH with only non-duplicate quests", () => {
    const state = makeGameState({
      quests: [makeQuest({ id: "q1", title: "Make Your Bed" })],
      parentSession: makeActiveSession(),
    });
    renderQuestManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Browse Templates" }));
    // Select a template not already in state
    fireEvent.click(screen.getByRole("button", { name: "Select quest: Vacuum Your Room" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Selected quests" }));
    // "Vacuum Your Room" added; "Make Your Bed" still present exactly once
    expect(screen.getByText("Vacuum Your Room")).toBeInTheDocument();
    expect(screen.getAllByText("Make Your Bed")).toHaveLength(1);
  });

  it("Cancel closes the template panel without dispatching", () => {
    renderQuestManagementTab();
    fireEvent.click(screen.getByRole("button", { name: "Browse Templates" }));
    expect(screen.getByRole("dialog", { name: /Browse Quest Templates/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel template browser" }));
    expect(screen.queryByRole("dialog", { name: /Browse Quest Templates/i })).not.toBeInTheDocument();
  });

  it("'Add Selected' dispatches nothing when all selected templates already exist", () => {
    const state = makeGameState({
      quests: [makeQuest({ id: "q1", title: "Make Your Bed" })],
      parentSession: makeActiveSession(),
    });
    renderQuestManagementTab(state);
    fireEvent.click(screen.getByRole("button", { name: "Browse Templates" }));
    // "Make Your Bed" is the only pre-selected template and it already exists in state
    fireEvent.click(screen.getByRole("button", { name: "Add Selected quests" }));
    // Modal closed, quest list unchanged
    expect(screen.queryByRole("dialog", { name: /Browse Quest Templates/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Make Your Bed")).toHaveLength(1);
  });
});
