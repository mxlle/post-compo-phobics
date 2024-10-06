import { getRandomItem } from "./utils/array-utils";
import { isGermanLanguage } from "./translations/i18n";

export const PHOBIAS = ["red", "green", "blue", "yellow", "purple", "orange", "hotpink", "cyan"] as const;

export type Indices<T extends readonly any[]> = Exclude<Partial<T>["length"], T["length"]>;

export type PhobiaIndex = Indices<typeof PHOBIAS>;

export type Phobia = (typeof PHOBIAS)[PhobiaIndex];

const PhobiaNameMap: Record<Phobia, string> = {
  red: "Erythrophobia",
  green: "Chlorophobia",
  blue: "Cyanophobia",
  yellow: "Xanthophobia",
  purple: "Porphyrophobia",
  orange: "Chrysophobia",
  hotpink: "Rhodophobia",
  cyan: "Glaucophobia",
};

export const PhobiaSymbolMap: Record<Phobia, string> = {
  red: "♥︎\u{FE0E}",
  green: "♣︎\u{FE0E}",
  blue: "☁︎\u{FE0E}",
  yellow: "☀︎\u{FE0E}",
  purple: "☂︎\u{FE0E}",
  orange: "♠︎\u{FE0E}",
  hotpink: "★\u{FE0E}",
  cyan: "♦︎\u{FE0E}",
};

export function getPhobiaName(phobia: Phobia | undefined): string {
  if (!phobia) {
    return "";
  }

  let phobiaName = PhobiaNameMap[phobia];

  if (process.env.GERMAN_ENABLED === "true") {
    if (isGermanLanguage()) {
      phobiaName = phobiaName.replace("phobia", "phobie");
    }
  }

  return phobiaName;
}

export const getRandomPhobia = (phobiaPool: Phobia[] = [...PHOBIAS]): Phobia => {
  return getRandomItem(phobiaPool);
};

export function getRandomPhobiaExcluding(excluded: (Phobia | unknown)[], phobiaPool: Phobia[] = [...PHOBIAS]): Phobia {
  const emojis = phobiaPool.filter((emoji) => !excluded.includes(emoji));
  return getRandomItem(emojis);
}
