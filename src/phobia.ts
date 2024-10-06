import { getRandomItem } from "./utils/array-utils";
import { isGermanLanguage } from "./translations/i18n";

export const ONBOARDING_PHOBIAS = ["red", "green", "blue", "yellow"] as const;

export const OTHER_PHOBIAS = ["purple", "orange", "hotpink", "cyan"] as const;

export const PHOBIAS = [...ONBOARDING_PHOBIAS, ...OTHER_PHOBIAS];

export type Indices<T extends readonly any[]> = Exclude<Partial<T>["length"], T["length"]>;

export type OnboardingEmojiIndex = Indices<typeof ONBOARDING_PHOBIAS>;
export type OtherEmojiIndex = Indices<typeof OTHER_PHOBIAS>;

export type Phobia = (typeof ONBOARDING_PHOBIAS)[OnboardingEmojiIndex] | (typeof OTHER_PHOBIAS)[OtherEmojiIndex];

const PhobiaNameMap: Record<Phobia, string> = {
  "red": "Erythrophobia",
  "green": "Chlorophobia",
  "blue": "Cyanophobia",
  "yellow": "Xanthophobia",
  "purple": "Porphyrophobia",
  "orange": "Chrysophobia",
  "hotpink": "Rhodophobia",
  "cyan": "Glaucophobia",
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
