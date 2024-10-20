import { BasePerson, Cell, GameFieldData, isChair, Person, PlacedPerson, WaitingPerson } from "../types";
import { getRandomPhobia, getRandomPhobiaExcluding, hasTablePhobia, Phobia, REGULAR_PHOBIAS, TABLE_PHOBIAS } from "../phobia";
import { getOnboardingData, OnboardingData } from "./onboarding";
import { globals } from "../globals";
import { getRandomIntFromInterval, shuffleArray } from "../utils/random-utils";
import { checkTableStates, getEmptyChairs, getGuestsOnTable, getNeighbors } from "./checks";
import { baseField, getGameFieldDataFromBaseField } from "./base-field";
import { createPersonElement } from "../components/game-field/cell-component";
import { transformPlacedPersonToWaitingPerson } from "./game-logic";
import { simplifiedCalculateParViaChains } from "./par";

export function placePersonsInitially(gameFieldData: GameFieldData): void {
  let onboardingData: OnboardingData | undefined = getOnboardingData();

  let placedPersons: PlacedPerson[];
  let waitingPersons: WaitingPerson[];

  if (onboardingData) {
    waitingPersons = applyWaitingPersons(onboardingData);
    placedPersons = applySeatedCharacters(onboardingData);
  } else {
    const minWaitingPersons = globals.settings.minInitialPanic;
    const charactersForGame = generateCharactersForGame(gameFieldData);
    placedPersons = randomlyApplyCharactersOnBoard(gameFieldData, charactersForGame, minWaitingPersons);
    const par = simplifiedCalculateParViaChains(placedPersons);
    const unhappyPersons = placedPersons.filter((p) => p.hasPanic);
    const happyPersons = placedPersons.filter((p) => !p.hasPanic);
    waitingPersons = unhappyPersons.map(transformPlacedPersonToWaitingPerson);
    const missingPersons = minWaitingPersons - waitingPersons.length;
    if (missingPersons > 0) {
      waitingPersons.push(...happyPersons.slice(0, missingPersons).map(transformPlacedPersonToWaitingPerson));
    }
    placedPersons = placedPersons.filter((p) => waitingPersons.every((wp) => wp.id !== p.id));

    globals.metaData = {
      minMoves: Math.max(par, waitingPersons.length),
      maxMoves: charactersForGame.length,
    };
  }

  globals.waitingPersons = waitingPersons;
  globals.placedPersons = placedPersons;
}

export function getGameFieldData(): GameFieldData {
  let field = baseField;
  let onboardingData: OnboardingData | undefined = getOnboardingData();

  if (onboardingData) {
    field = onboardingData.field;
  }

  const gameFieldData = getGameFieldDataFromBaseField(field);

  document.body.style.setProperty("--s-cnt", field.length.toString());

  return gameFieldData;
}

function generateCharactersForGame(gameField: GameFieldData, iteration: number = 0): Person[] {
  const placedPersons: PlacedPerson[] = [];
  const { minAmount, maxAmount, chanceForTablePhobia } = globals.settings;
  const amount = getRandomIntFromInterval(minAmount, maxAmount);
  const characters: Person[] = [];

  let id = 0;
  while (characters.length < amount) {
    const newPerson = generatePerson(chanceForTablePhobia, id++);
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
    const personHasTablePhobia = hasTablePhobia(person);
    const guestHasTablePhobia = hasTablePhobia(guest);
    const isAfraidOf = personHasTablePhobia && person.phobia && guest.name === person.phobia;
    const makesAfraid = guestHasTablePhobia && guest.phobia && guest.phobia === person.name;

    if (isAfraidOf || makesAfraid) {
      return true;
    }
  }

  const neighbors = getNeighbors(placedPersons, cell);

  for (let guest of neighbors) {
    const personHasTablePhobia = hasTablePhobia(person);
    const guestHasTablePhobia = hasTablePhobia(guest);
    const isAfraidOf = !personHasTablePhobia && person.phobia && guest.name === person.phobia;
    const makesAfraid = !guestHasTablePhobia && guest.phobia && guest.phobia === person.name;

    if (isAfraidOf || makesAfraid) {
      return true;
    }
  }

  return false;
}

function generatePerson(chanceForTablePhobia: number, id: number): Person {
  let name: Phobia;
  let phobia: Phobia | undefined;

  const phobiaTypeRandomValue = Math.random();

  if (phobiaTypeRandomValue < chanceForTablePhobia) {
    name = getRandomPhobia(TABLE_PHOBIAS);
  } else {
    name = getRandomPhobia(REGULAR_PHOBIAS);
  }

  phobia = getRandomPhobiaExcluding([name]);

  const basePerson: BasePerson = {
    id,
    name,
    phobia,
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

function randomlyApplyCharactersOnBoard(
  gameFieldData: GameFieldData,
  characters: Person[],
  minInitialPanic: number,
  iteration = 0,
): PlacedPerson[] {
  const placedPersons: PlacedPerson[] = [];
  const copyOfCharacters = [...characters];
  const allChairs = gameFieldData.allCells.filter(isChair);
  const shuffledRequiredChairs = shuffleArray(allChairs).slice(0, copyOfCharacters.length);
  shuffledRequiredChairs.forEach((chair: Cell) => {
    const person = copyOfCharacters.pop();

    if (!person) {
      return;
    }

    const { row, column, tableIndex } = chair;
    placedPersons.push({ ...person, row, column, tableIndex });
  });

  checkTableStates(gameFieldData, placedPersons);

  const numAfraid = placedPersons.filter((person) => person.hasPanic).length;

  if ((numAfraid < minInitialPanic && iteration < 10) || (numAfraid === 0 && iteration < 50)) {
    console.debug("not afraid enough, reshuffling");

    const recursionResult = randomlyApplyCharactersOnBoard(gameFieldData, characters, minInitialPanic, iteration + 1);
    const recursionAfraid = recursionResult.filter((person) => person.hasPanic).length;

    if (recursionAfraid > numAfraid) {
      return recursionResult;
    }

    console.debug("recursion did not improve, keeping current state");
  }

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
  return onboardingData.waitingPersons.map((character): WaitingPerson => {
    return {
      ...character,
      personElement: createPersonElement(character),
    };
  });
}
