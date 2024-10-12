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
  par?: number;
  arrow?: {
    row: number;
    column: number;
    direction: Direction;
  };
}

type BaseFieldIndex = IntRange<0, 9>;

type ShortCharacterDefinition = {
  nameI: PhobiaIndex;
  fearI?: PhobiaIndex;
  smallFearI?: PhobiaIndex;
  row: BaseFieldIndex;
  column: BaseFieldIndex;
};

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
    { row: 0, column: 0, nameI: 0, smallFearI: 1 },
    { row: 1, column: 3, nameI: 1 },
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
    { row: 0, column: 3, nameI: 0, fearI: 1, smallFearI: 2 },
    { row: 2, column: 0, nameI: 1 },
    { row: 2, column: 4, nameI: 2, fearI: 1 },
    { row: 4, column: 6, nameI: 3 },
    { row: 3, column: 2, nameI: 4 },
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
    { row: 0, column: 3, nameI: 0, fearI: 1, smallFearI: 2 },
    { row: 2, column: 2, nameI: 1 },
    { row: 2, column: 6, nameI: 2, fearI: 1 },
    { row: 3, column: 6, nameI: 2, smallFearI: 0 },
    { row: 4, column: 4, nameI: 3 },
    { row: 3, column: 0, nameI: 4 },
    { row: 4, column: 2, nameI: 4 },
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
    par: 2,
  };
}

/**
 * 24 characters, 12 at each table
 * 8 with big fear, 10 with small fear, 6 with both
 * 1st not at a table, all tables without panic
 */
function getOnboardingDataForTriskaidekaphobia(): OnboardingData {
  const onboardingCharacters: ShortCharacterDefinition[] = [
    { row: 0, column: 3, nameI: 0, fearI: 1, smallFearI: 4 },
    // type 1
    { row: 1, column: 0, nameI: 1 },
    { row: 2, column: 0, nameI: 1 },
    { row: 1, column: 2, nameI: 1 },
    { row: 2, column: 2, nameI: 1 },
    // type 2
    { row: 3, column: 0, nameI: 2 },
    { row: 4, column: 0, nameI: 2 },
    { row: 3, column: 2, nameI: 2 },
    { row: 4, column: 2, nameI: 2 },
    // type 3
    { row: 5, column: 0, nameI: 3 },
    { row: 6, column: 0, nameI: 3 },
    { row: 5, column: 2, nameI: 3 },
    { row: 6, column: 2, nameI: 3 },
    // type 4
    { row: 1, column: 5, nameI: 4 },
    { row: 2, column: 5, nameI: 4 },
    { row: 1, column: 7, nameI: 4 },
    { row: 2, column: 7, nameI: 4 },
    // type 5
    { row: 3, column: 5, nameI: 5 },
    { row: 4, column: 5, nameI: 5 },
    { row: 3, column: 7, nameI: 5 },
    { row: 4, column: 7, nameI: 5 },
    // type 6
    { row: 5, column: 5, nameI: 6 },
    { row: 6, column: 5, nameI: 6 },
    { row: 5, column: 7, nameI: 6 },
    { row: 6, column: 7, nameI: 6 },
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
    par: 3,
  };
}

function getPersonsWithPositionFromShortDescription(short: ShortCharacterDefinition[]): PersonWithPosition[] {
  const cesar = getRandomIntFromInterval(0, PHOBIAS.length - 1);
  const getOEmoji = (index: number) => {
    const newIndex = (cesar + index) % PHOBIAS.length;
    return PHOBIAS[newIndex];
  };

  return short.map(({ nameI, fearI, smallFearI, row, column }: ShortCharacterDefinition) => {
    const name = getOEmoji(nameI);
    const fear = fearI !== undefined ? getOEmoji(fearI) : undefined;
    const smallFear = smallFearI !== undefined ? getOEmoji(smallFearI) : undefined;

    return {
      name,
      fear,
      smallFear,
      row,
      column,
    };
  });
}
