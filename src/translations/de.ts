import { TranslationKey } from "./index";

export const deTranslations: Record<TranslationKey, string> = {
  [TranslationKey.WELCOME]: "Willkommen bei der Gesellschaft der Multiphobiker",
  [TranslationKey.GOAL]: "🏁 Platziere alle Emojis an den Tischen ohne ihre Phobien auszulösen.",
  [TranslationKey.START_GAME]: "Spiel starten",
  [TranslationKey.WIN]: "Du hast gewonnen 🎉",
  [TranslationKey.PLAY_AGAIN]: "Nochmal spielen",
  [TranslationKey.CONTINUE]: "Weiter",
  [TranslationKey.CANCEL]: "Abbrechen",
  [TranslationKey.EXAMPLE_EMOJI]: "{0} möchte an den Tisch gesetzt werden.",
  [TranslationKey.EXAMPLE_BIG_FEAR]: "{0} hat <em>{1}</em> und fürchtet sich, wenn {2} am selben Tisch sitzt.",
  [TranslationKey.EXAMPLE_SMALL_FEAR]:
    "{0} hat ein bisschen <em>{1}</em> und fürchtet sich, wenn {2} neben oder gegenüber von ihnen sitzt.",
  [TranslationKey.RULES]: "Regeln",
  [TranslationKey.RULES_CONTENT]: `🏁 Das Ziel ist es, alle Emojis an den Tischen zu platzieren, ohne dass sich jemand fürchtet.

😱 Emojis fürchten sich vor bestimmten anderen Emojis. Klicke auf ein Emoji, um zu sehen, vor wem sie sich fürchten.

1️⃣3️⃣🙀 Außerdem leiden alle Emojis an <em>Triskaidekaphobie</em>.

🚪 Die meisten Emojis sitzen bereits an den Tischen. Aber es könnte auch einige geben, die an der Tür warten.

😀 Wenn alle Emojis glücklich sind, hast du gewonnen! 🎉`,
  [TranslationKey.ABOUT]: "Über {0}",
  [TranslationKey.INFO_PLACEHOLDER]: "Wähle ein Emoji aus, um mehr darüber zu erfahren.",
  [TranslationKey.INFO_CHAIR]: "Ein Stuhl. Jemand kann hier sitzen.",
  [TranslationKey.INFO_TABLE]: "Tisch {0}",
  [TranslationKey.INFO_TABLE_OCCUPANCY]: "Belegung: {0}/{1} 🪑",
  [TranslationKey.INFO_DECOR]: "Dekoration",
  [TranslationKey.INFO_EMPTY]: "Leeres Feld. Jemand kann hier warten.",
  [TranslationKey.TARGET_CLICK]: "Zum Bewegen, auf den Ziel-🪑 klicken",
};