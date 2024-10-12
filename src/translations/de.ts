import { TranslationKey } from "./i18n";

export function getDeTranslationMap(): Record<TranslationKey, string> {
  if (process.env.GERMAN_ENABLED === "true") {
    return deTranslations;
  }

  throw new Error("German language is not enabled.");
}

const deTranslations: Record<TranslationKey, string> = {
  [TranslationKey.INFO_TRISKAIDEKAPHOBIA]: "nie genau 13 an einem Tisch",
  [TranslationKey.TRISKAIDEKAPHOBIA]: "Triskaidekaphobie",
  [TranslationKey.WELCOME]: "Willkommen bei der Gesellschaft der Multiphobiker",
  [TranslationKey.GOAL]: "🏁 Platziere alle Personen an den Tischen ohne ihre Phobien auszulösen.",
  [TranslationKey.GOAL_2]: "🏁 Was für ein Chaos! Sortiere die Personen um, bis alle Phobien aufgelöst sind.",
  [TranslationKey.START_GAME]: "Spiel starten",
  [TranslationKey.NEW_GAME]: "Neues Spiel",
  [TranslationKey.WIN]: "Gewonnen 🎉",
  [TranslationKey.CONTINUE]: "Weiter",
  [TranslationKey.BACK]: "Zurück",
  [TranslationKey.BIG_FEAR]: "Große {0}",
  [TranslationKey.SMALL_FEAR]: "Kleine {0}",
  [TranslationKey.INFO_BIG_FEAR]: "keine {0} am selben Tisch (A)",
  [TranslationKey.INFO_SMALL_FEAR]: "keine {0} daneben oder gegenüber (B)",
  [TranslationKey.INFO_FOMO]: "einem Sitzplatz zugewiesen",
  [TranslationKey.INFO_PHOBIAS]: "Phobien: {0}",
  [TranslationKey.INFO_PLACEHOLDER]: "Wähle eine Person aus, um mehr über sie zu erfahren.",
  [TranslationKey.INFO_CHAIR]: "Ein Stuhl. Jemand kann hier sitzen.",
  [TranslationKey.INFO_TABLE]: "Tisch {0}",
  [TranslationKey.INFO_TABLE_OCCUPANCY]: "Belegung: {0}/{1} 🪑",
  [TranslationKey.INFO_DECOR]: "Dekoration",
  [TranslationKey.INFO_EMPTY]: "Leeres Feld. Jemand kann hier warten.",
  [TranslationKey.DIFFICULTY]: "Schwierigkeit",
  [TranslationKey.DIFFICULTY_EASY]: "Leicht",
  [TranslationKey.DIFFICULTY_MEDIUM]: "Mittel",
  [TranslationKey.DIFFICULTY_HARD]: "Schwer",
  [TranslationKey.DIFFICULTY_EXTREME]: "Extrem",
  [TranslationKey.MOVES]: "Züge",
  [TranslationKey.HIGHSCORE]: "Top:",
  [TranslationKey.AVERAGE]: "Ø",
};
