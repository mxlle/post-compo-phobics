import { BasePerson, Cell, CellType, GameFieldData, isChair, isTable, Person, PlacedPerson, WaitingPerson } from "../types";
import { getRandomPhobia, getRandomPhobiaExcluding, Phobia } from "../phobia";
import { getOnboardingData, OnboardingData } from "./onboarding";
import { globals } from "../globals";
import { getRandomIntFromInterval, shuffleArray } from "../utils/random-utils";
import { getEmptyChairs, getGuestsOnTable, getNeighbors } from "./checks";
import { baseField } from "./base-field";
import { createPersonElement } from "../components/game-field/cell-component";
import { simplifiedCalculateParViaChains } from "./par";

export function placePersonsInitially(gameFieldData: GameFieldData): void {
  let onboardingData: OnboardingData | undefined = getOnboardingData();

  let placedPersons: PlacedPerson[];
  let waitingPersons: WaitingPerson[];

  if (onboardingData) {
    waitingPersons = applyWaitingPersons(onboardingData);
    placedPersons = applySeatedCharacters(onboardingData);
  } else {
    const charactersForGame = generateCharactersForGame(gameFieldData);
    const splitIndex = globals.settings.minInitialPanic;
    const waiting = charactersForGame.slice(0, splitIndex);
    const sitting = charactersForGame.slice(splitIndex);
    waitingPersons = waiting.map((character, index): WaitingPerson => {
      return {
        ...character,
        index,
        personElement: createPersonElement(character),
      };
    });
    placedPersons = randomlyApplyCharactersOnBoard(gameFieldData, sitting);

    //const time = performance.now();
    const par = simplifiedCalculateParViaChains(placedPersons) + waiting.length;
    // const par = calculatePar(gameFieldData, [...placedPersons]);
    // console.info("PAR CALCULATION TOOK", performance.now() - time);
    console.info("FINAL PAR", par);

    globals.metaData = {
      minMoves: par,
      maxMoves: charactersForGame.length,
    };
  }

  globals.waitingPersons = waitingPersons;
  globals.placedPersons = placedPersons;
}

export function getGameFieldData(): GameFieldData {
  let field = baseField;
  let onboardingData: OnboardingData | undefined = getOnboardingData();
  let tableHeight = 8;

  if (onboardingData) {
    field = onboardingData.field;
    tableHeight = onboardingData.tableHeight;
  }

  document.body.style.setProperty("--s-cnt", field.length.toString());
  document.body.style.setProperty("--table-height", tableHeight.toString());

  if (tableHeight % 2 === 0) {
    const topValue = (tableHeight / 2 - 1) * -100;
    document.body.style.setProperty("--table-top", topValue.toString() + "%");
  } else {
    document.body.style.removeProperty("--table-top");
  }

  const gameField: GameFieldData = [];
  for (let row = 0; row < field.length; row++) {
    const baseRow = field[row];
    const rowArray: Cell[] = [];
    for (let column = 0; column < baseRow.length; column++) {
      const baseCell = baseRow[column];

      rowArray.push(getGameFieldObject(baseCell, row, column, onboardingData));
    }
    gameField.push(rowArray);
  }

  return gameField;
}

function getGameFieldObject(type: CellType, row: number, column: number, onboardingData: OnboardingData | undefined): Cell {
  const obj: Cell = {
    type,
    row,
    column,
  };

  if (isChair(type) || isTable(type)) {
    obj.tableIndex = column > 3 ? 1 : 0;

    if (onboardingData) {
      obj.tableIndex = onboardingData.getTableIndex(row, column);
    }
  }

  return obj;
}

function generateCharactersForGame(gameField: GameFieldData, iteration: number = 0): Person[] {
  const placedPersons: PlacedPerson[] = [];
  const { minAmount, maxAmount, chanceForBigFear, chanceForSmallFear } = globals.settings;
  const amount = getRandomIntFromInterval(minAmount, maxAmount);
  const characters: Person[] = [];

  while (characters.length < amount) {
    const newPerson = generatePerson(chanceForBigFear, chanceForSmallFear);
    const chair = findValidChair(gameField, placedPersons, newPerson);

    if (chair) {
      characters.push(newPerson);
      const { row, column, tableIndex } = chair;
      placedPersons.push({ ...newPerson, row, column, tableIndex });
    }
  }

  const table1Guests = getGuestsOnTable(placedPersons, 0);
  const table2Guests = getGuestsOnTable(placedPersons, 1);

  if (table1Guests.length === 13 || table2Guests.length === 13) {
    if (iteration < 10) {
      console.info("triskaidekaphobia is triggered, recreating");
      return generateCharactersForGame(gameField, iteration + 1);
    }

    console.warn("did not find valid gamefield after 10 iterations, might not be solvable");
  }

  return characters;
}

export function findValidChair(gameFieldData: GameFieldData, placedPersons: PlacedPerson[], person: Person): Cell | undefined {
  const emptyChairs = getEmptyChairs(gameFieldData, placedPersons);

  for (let chair of emptyChairs) {
    if (!isTriggeringPhobia(placedPersons, chair, person)) {
      return chair;
    }
  }
}

export function isTriggeringPhobia(placedPersons: PlacedPerson[], cell: Cell, person: Person): boolean {
  const tableGuests = getGuestsOnTable(placedPersons, cell.tableIndex);

  for (let guest of tableGuests) {
    const isAfraidOf = person.fear && guest.name === person.fear;
    const makesAfraid = guest.fear && guest.fear === person.name;

    if (isAfraidOf || makesAfraid) {
      return true;
    }
  }

  const neighbors = getNeighbors(placedPersons, cell);

  for (let guest of neighbors) {
    const isAfraidOf = person.smallFear && guest.name === person.smallFear;
    const makesAfraid = guest.smallFear && guest.smallFear === person.name;

    if (isAfraidOf || makesAfraid) {
      return true;
    }
  }

  return false;
}

function generatePerson(chanceForBigFear: number, chanceForSmallFear: number): Person {
  const name = getRandomPhobia();
  let fear: Phobia | undefined;
  let smallFear: Phobia | undefined;

  const fearTypeRandomValue = Math.random();

  if (fearTypeRandomValue > 1 - chanceForBigFear) {
    fear = getRandomPhobiaExcluding([name]);
  }

  if (fearTypeRandomValue < chanceForSmallFear) {
    smallFear = getRandomPhobiaExcluding([name, fear]);
  }

  const basePerson: BasePerson = {
    name,
    fear,
    smallFear,
  };

  return {
    ...basePerson,
    hasPanic: false,
    triskaidekaphobia: false,
    afraidOf: [],
    makesAfraid: [],
    personElement: createPersonElement(basePerson),
  };
}

function randomlyApplyCharactersOnBoard(gameFieldData: GameFieldData, characters: Person[]): PlacedPerson[] {
  const placedPersons: PlacedPerson[] = [];
  const copyOfCharacters = [...characters];
  const allChairs = gameFieldData.flat().filter(isChair);
  const shuffledRequiredChairs = shuffleArray(allChairs).slice(0, copyOfCharacters.length);
  shuffledRequiredChairs.forEach((chair: Cell) => {
    const person = copyOfCharacters.pop();

    if (!person) {
      return;
    }

    const { row, column, tableIndex } = chair;
    placedPersons.push({ ...person, row, column, tableIndex });
  });

  // checkTableStates(gameFieldData, placedPersons);

  return placedPersons;
}

function applySeatedCharacters(onboardingData: OnboardingData): PlacedPerson[] {
  const { getTableIndex, sittingPersons } = onboardingData;

  return sittingPersons.map((character): PlacedPerson => {
    const relatedCellType = onboardingData.field[character.row][character.column];

    return {
      ...character,
      triskaidekaphobia: false,
      hasPanic: false,
      afraidOf: [],
      makesAfraid: [],
      tableIndex: isChair(relatedCellType) ? getTableIndex(character.row, character.column) : undefined,
      personElement: createPersonElement(character),
    };
  });
}

function applyWaitingPersons(onboardingData: OnboardingData): WaitingPerson[] {
  return onboardingData.waitingPersons.map((character, index): WaitingPerson => {
    return {
      ...character,
      index,
      personElement: createPersonElement(character),
    };
  });
}
