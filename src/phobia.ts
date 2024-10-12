import { getRandomItem } from "./utils/array-utils";
import { isGermanLanguage } from "./translations/i18n";

// import svgs
import heart from "./assets/svgs/heart.svg";
import tree from "./assets/svgs/tree.svg";
import cloud from "./assets/svgs/cloud.svg";
import sun from "./assets/svgs/sun.svg";
import moon from "./assets/svgs/moon.svg";
import fire from "./assets/svgs/fire.svg";
import carbon from "./assets/svgs/carbon.svg";
import waterDrop from "./assets/svgs/water-drop.svg";

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

export const PhobiaSvgMap: Record<Phobia, SVGElement> = {
  red: heart(),
  green: tree(),
  blue: cloud(),
  yellow: sun(),
  purple: moon(),
  orange: fire(),
  hotpink: carbon(),
  cyan: waterDrop(),
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
