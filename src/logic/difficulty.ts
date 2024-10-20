import { getTranslation, TranslationKey } from "../translations/i18n";
import { Settings } from "../types";
import { getLocalStorageItem, LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";

export const enum Difficulty {
  EASY,
  MEDIUM,
  HARD,
  EXTREME,
}

export interface DifficultyStats {
  highscore: number;
  average: number;
  count: number;
}

export const difficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.EXTREME];

export const difficultySettings: Record<Difficulty, Settings> = {
  [Difficulty.EASY]: {
    minAmount: 14,
    maxAmount: 16,
    chanceForTablePhobia: 0.2,
    minInitialPanic: 3,
  },
  [Difficulty.MEDIUM]: {
    minAmount: 17,
    maxAmount: 19,
    chanceForTablePhobia: 0.3,
    minInitialPanic: 4,
  },
  [Difficulty.HARD]: {
    minAmount: 20,
    maxAmount: 22,
    chanceForTablePhobia: 0.4,
    minInitialPanic: 5,
  },
  [Difficulty.EXTREME]: {
    minAmount: 24,
    maxAmount: 24,
    chanceForTablePhobia: 0.6,
    minInitialPanic: 6,
  },
};

export const difficultyEmoji: Record<Difficulty, string> = {
  [Difficulty.EASY]: "💚",
  [Difficulty.MEDIUM]: "🟡",
  [Difficulty.HARD]: "🟥",
  [Difficulty.EXTREME]: "💀",
};

export function getDifficultyText(difficulty: Difficulty): string {
  switch (difficulty) {
    case Difficulty.EASY:
      return getTranslation(TranslationKey.DIFFICULTY_EASY);
    case Difficulty.MEDIUM:
      return getTranslation(TranslationKey.DIFFICULTY_MEDIUM);
    case Difficulty.HARD:
      return getTranslation(TranslationKey.DIFFICULTY_HARD);
    case Difficulty.EXTREME:
      return getTranslation(TranslationKey.DIFFICULTY_EXTREME);
  }
}

export function getDifficultyStats(difficulty: Difficulty): DifficultyStats {
  const storedScoreStats = getLocalStorageItem(getStorageKey(difficulty));

  if (!storedScoreStats) return { highscore: 0, average: 0, count: 0 };

  const [highscore, average, count] = storedScoreStats.split(",").map(Number);

  return { highscore, average, count };
}

export function setDifficultyStats(difficulty: Difficulty, score: number) {
  const stats = getDifficultyStats(difficulty);
  console.log(stats);
  const newCount = stats.count + 1;
  const newAverage = Math.round((stats.average * stats.count + score) / newCount);

  setLocalStorageItem(getStorageKey(difficulty), [Math.max(stats.highscore, score), newAverage, newCount].join(","));
}

function getStorageKey(difficulty: Difficulty): LocalStorageKey {
  switch (difficulty) {
    case Difficulty.EASY:
      return LocalStorageKey.DIFFICULTY_EASY;
    case Difficulty.MEDIUM:
      return LocalStorageKey.DIFFICULTY_MEDIUM;
    case Difficulty.HARD:
      return LocalStorageKey.DIFFICULTY_HARD;
    case Difficulty.EXTREME:
      return LocalStorageKey.DIFFICULTY_EXTREME;
  }
}
