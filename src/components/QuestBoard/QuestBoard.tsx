import { useState } from "react";
import { useGameState, useGameDispatch } from "../../state/GameContext.js";
import { QuestCard } from "../QuestCard/index.js";
import { FilterSortBar } from "../FilterSortBar/FilterSortBar.js";
import { PlayerHero } from "../PlayerHero/PlayerHero.js";
import { PlayerSwitcher } from "../PlayerSwitcher/PlayerSwitcher.js";
import { RewardShop } from "../RewardShop/RewardShop.js";
import {
  DEFAULT_FILTER_SORT,
  applyFiltersAndSort,
  getUniqueCategories,
} from "../../utils/questFilters.js";
import type { QuestFilterSortOptions } from "../../utils/questFilters.js";
import styles from "./QuestBoard.module.css";

interface QuestBoardProps {
  activePlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
  onExit: () => void;
}

export function QuestBoard({
  activePlayerId,
  onPlayerSelect,
  onExit,
}: QuestBoardProps): JSX.Element | null {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [filterSortOptions, setFilterSortOptions] =
    useState<QuestFilterSortOptions>(DEFAULT_FILTER_SORT);
  const [showRewardShop, setShowRewardShop] = useState(false);

  // No player selected — show player selection screen
  if (activePlayerId === null) {
    return (
      <section aria-label="Select a player" className={styles.selectionScreen}>
        <h1 className={styles.selectionHeading}>Who&apos;s playing?</h1>
        <PlayerSwitcher
          players={state.players}
          activePlayerId={null}
          onSelect={onPlayerSelect}
        />
      </section>
    );
  }

  const activePlayer = state.players.find((p) => p.id === activePlayerId);
  if (activePlayer === undefined) {
    return null;
  }

  if (showRewardShop) {
    return (
      <RewardShop
        activePlayerId={activePlayerId}
        onBack={() => setShowRewardShop(false)}
      />
    );
  }

  const activeQuests = state.quests.filter((q) => q.isActive !== false);
  const visibleQuests = applyFiltersAndSort(activeQuests, filterSortOptions);
  const availableCategories = getUniqueCategories(activeQuests);

  return (
    <div className={styles.board}>
      <div className={styles.topBar}>
        <PlayerHero player={activePlayer} onExit={onExit} />
      </div>

      <button
        aria-label="Open Reward Shop"
        onClick={() => setShowRewardShop(true)}
        className={styles.shopButton}
      >
        Reward Shop
      </button>

      <FilterSortBar
        options={filterSortOptions}
        onChange={setFilterSortOptions}
        availableCategories={availableCategories}
      />

      <div className={styles.questGrid}>
        <ul aria-label="Quest board" className={styles.questList}>
          {visibleQuests.map((q) => {
            const activeClaim =
              [...state.claims]
                .filter((c) => c.questId === q.id && c.playerId === activePlayerId)
                .sort((a, b) => (b.claimedAt as Date).getTime() - (a.claimedAt as Date).getTime())[0]
              ?? null;
            return (
              <li key={q.id}>
                <QuestCard
                  quest={q}
                  player={activePlayer}
                  activeClaim={activeClaim}
                  onClaim={(id) =>
                    dispatch({
                      type: "CLAIM_QUEST",
                      questId: id,
                      playerId: activePlayerId,
                    })
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.switcherWrapper}>
        <PlayerSwitcher
          players={state.players}
          activePlayerId={activePlayerId}
          onSelect={onPlayerSelect}
        />
      </div>
    </div>
  );
}
