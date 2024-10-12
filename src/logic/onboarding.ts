import { PhobiaIndex, PHOBIAS } from "../phobia";
import { CellType, getCellTypesWithoutPrefix, PersonWithPosition } from "../types";
import { globals } from "../globals";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { Direction } from "../components/onboarding/onboarding-components";
import { baseField } from "./base-field";
import type { IntRange } from "type-fest";
import { getRandomIntFromInterval } from "../utils/random-utils";

export const enum OnboardingStep {
  INTRO = 0,
  BIG_FEAR = 1,
  RESORT = 2,
  TRISKAIDEKAPHOBIA = 3,
}

export function isOnboarding() {
  return globals.onboardingStep !== -1;
}

export function wasOnboarding() {
  return isOnboarding() || globals.previousOnboardingStep !== undefined;
}

export interface OnboardingData {
  field: CellType[][];
  characters: PersonWithPosition[];
  tableHeight: number;
  isTableMiddle: (rowIndex: number) => boolean;
  getTableIndex: (row: number, column: number) => number;
  arrow?: {
    row: number;
    column: number;
    direction: Direction;
  };
}

type BaseFieldIndex = IntRange<0, 9>;

type ShortCharacterDefinition = [
  nameIndex: PhobiaIndex,
  fearIndex: PhobiaIndex | -1,
  smallFearIndex: PhobiaIndex | -1,
  rowIndex: BaseFieldIndex,
  columnIndex: BaseFieldIndex,
];

// a 4 by 4 grid
const onboardingField = (() => {
  const { _, T, c } = getCellTypesWithoutPrefix();
  return [
    [_, _, _, _],
    [_, c, T, c],
    [_, c, T, c],
    [_, _, _, _],
  ];
})();

// a 7 by 7 grid
const mediumField = (() => {
  const { _, T, c } = getCellTypesWithoutPrefix();
  return [
    [_, _, _, _, _, _, _],
    [_, _, _, _, _, _, _],
    [c, T, c, _, c, T, c],
    [c, T, c, _, c, T, c],
    [c, T, c, _, c, T, c],
    [_, _, _, _, _, _, _],
    [_, _, _, _, _, _, _],
  ];
})();

export function getOnboardingData(): OnboardingData | undefined {
  const step = globals.onboardingStep;

  switch (step) {
    case OnboardingStep.INTRO:
      return getOnboardingDataForIntro();
    case OnboardingStep.BIG_FEAR:
      return getOnboardingDataForBothPhobias();
    case OnboardingStep.RESORT:
      return getOnboardingDataForResort();
    case OnboardingStep.TRISKAIDEKAPHOBIA:
      return getOnboardingDataForTriskaidekaphobia();
    default:
      return undefined;
  }
}

export function increaseOnboardingStepIfApplicable() {
  if (!isOnboarding()) {
    globals.previousOnboardingStep = undefined;
    return;
  }

  globals.previousOnboardingStep = globals.onboardingStep;

  let step = globals.onboardingStep + 1;

  if (step > OnboardingStep.TRISKAIDEKAPHOBIA) {
    step = -1;
  }

  globals.onboardingStep = step;
  setLocalStorageItem(LocalStorageKey.ONBOARDING_STEP, step.toString());
}

function getOnboardingDataForIntro(): OnboardingData {
  const short: ShortCharacterDefinition[] = [
    [0, -1, 1, 0, 0],
    [1, -1, -1, 1, 3],
  ];

  return {
    field: onboardingField,
    characters: getPersonsWithPositionFromShortDescription(short),
    tableHeight: 2,
    isTableMiddle: (rowIndex) => rowIndex === 1,
    getTableIndex: (_row, _column) => {
      return 0;
    },
    arrow: {
      row: 0,
      column: 0,
      direction: Direction.UP,
    },
  };
}

function getOnboardingDataForBothPhobias(): OnboardingData {
  const short: ShortCharacterDefinition[] = [
    [0, 1, 2, 0, 3],
    [1, -1, -1, 2, 0],
    [2, 1, -1, 2, 4],
    [3, -1, -1, 4, 6],
    [4, -1, -1, 3, 2],
  ];

  return {
    field: mediumField,
    characters: getPersonsWithPositionFromShortDescription(short),
    tableHeight: 3,
    isTableMiddle: (rowIndex) => rowIndex === 3,
    getTableIndex: (_row, column) => {
      return column < 3 ? 0 : 1;
    },
    arrow: {
      row: 0,
      column: 3,
      direction: Direction.LEFT,
    },
  };
}

function getOnboardingDataForResort(): OnboardingData {
  const short: ShortCharacterDefinition[] = [
    [0, 1, 2, 0, 3],
    [1, -1, -1, 2, 2],
    [2, 1, -1, 2, 6],
    [2, -1, 0, 3, 6],
    [3, -1, -1, 4, 4],
    [4, -1, -1, 3, 0],
    [4, -1, -1, 4, 2],
  ];

  return {
    field: mediumField,
    characters: getPersonsWithPositionFromShortDescription(short),
    tableHeight: 3,
    isTableMiddle: (rowIndex) => rowIndex === 3,
    getTableIndex: (_row, column) => {
      return column < 3 ? 0 : 1;
    },
    arrow: {
      row: 0,
      column: 3,
      direction: Direction.RIGHT,
    },
  };
}

/**
 * 24 characters, 12 at each table
 * 8 with big fear, 10 with small fear, 6 with both
 * 1st not at a table, all tables without panic
 */
function getOnboardingDataForTriskaidekaphobia(): OnboardingData {
  // there are 9 different emojis in the onboarding, so the nameIndex is 0-8, same for the fears, we then repeat some
  const onboardingCharacters: ShortCharacterDefinition[] = [
    [0, 1, 4, 0, 3],
    [1, -1, -1, 1, 0],
    [1, -1, -1, 2, 0],
    [2, -1, -1, 3, 0],
    [2, -1, -1, 4, 0],
    [3, -1, -1, 5, 0],
    [3, -1, -1, 6, 0],
    [1, -1, -1, 1, 2],
    [1, -1, -1, 2, 2],
    [2, -1, -1, 3, 2],
    [2, -1, -1, 4, 2],
    [3, -1, -1, 5, 2],
    [3, -1, -1, 6, 2],
    [4, -1, -1, 1, 5],
    [4, -1, -1, 2, 5],
    [5, -1, -1, 3, 5],
    [5, -1, -1, 4, 5],
    [6, -1, -1, 5, 5],
    [6, -1, -1, 6, 5],
    [4, -1, -1, 1, 7],
    [4, -1, -1, 2, 7],
    [5, -1, -1, 3, 7],
    [5, -1, -1, 4, 7],
    [6, -1, -1, 5, 7],
    [6, -1, -1, 6, 7],
  ];

  return {
    field: baseField,
    characters: getPersonsWithPositionFromShortDescription(onboardingCharacters),
    tableHeight: 8,
    isTableMiddle: (rowIndex: number) => rowIndex === Math.ceil(baseField.length / 2) - 1,
    getTableIndex: (_row, column) => (column > 3 ? 1 : 0),
    arrow: {
      row: 0,
      column: 3,
      direction: Direction.LEFT,
    },
  };
}

function getPersonsWithPositionFromShortDescription(short: ShortCharacterDefinition[]): PersonWithPosition[] {
  const cesar = getRandomIntFromInterval(0, PHOBIAS.length - 1);
  const getOEmoji = (index: number) => {
    const newIndex = (cesar + index) % PHOBIAS.length;
    return PHOBIAS[newIndex];
  };

  return short.map(([nameIndex, fearIndex, smallFearIndex, rowIndex, columnIndex]) => {
    const name = getOEmoji(nameIndex);
    const fear = fearIndex !== -1 ? getOEmoji(fearIndex) : undefined;
    const smallFear = smallFearIndex !== -1 ? getOEmoji(smallFearIndex) : undefined;

    return {
      name,
      fear,
      smallFear,
      row: rowIndex,
      column: columnIndex,
    };
  });
}
