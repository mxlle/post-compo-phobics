import {
  Cell,
  CellPosition,
  CellPositionWithTableIndex,
  GameFieldData,
  isAtTable,
  isEmptyChair,
  isSameCell,
  isTable,
  PlacedPerson,
  WaitingPerson,
} from "../types";
import { hasTablePhobia } from "../phobia";

export function checkTableStates(gameFieldData: GameFieldData, placedPersons: PlacedPerson[]) {
  const panickedTableCells: Cell[] = [];

  for (let tableIndex = 0; tableIndex < gameFieldData.tableAssignments.length; tableIndex++) {
    const guests = getGuestsOnTable(placedPersons, tableIndex);
    const isPanic = guests.length === 13;

    if (isPanic) {
      panickedTableCells.push(...getTableCells(gameFieldData, tableIndex));
    }

    guests.forEach((guest) => {
      const isTablePhobia = hasTablePhobia(guest);
      const afraidOf = isTablePhobia
        ? guests.filter((otherGuest) => otherGuest.name === guest.phobia)
        : getScaryNeighbors(placedPersons, guest);

      guest.hasPanic = afraidOf.length > 0;
      guest.triskaidekaphobia = isPanic;
      guest.afraidOf = afraidOf;
    });
  }

  const otherGuestsInRoom = placedPersons.filter((guest) => guest.tableIndex === undefined);
  otherGuestsInRoom.forEach((guest) => {
    guest.hasPanic = false;
    guest.triskaidekaphobia = false;
    guest.afraidOf = [];
  });

  const afraidGuests = placedPersons.filter((guest) => guest.hasPanic);
  placedPersons.forEach((guest) => {
    guest.makesAfraid = afraidGuests.filter((otherGuest) => otherGuest.afraidOf.find((afraidOf) => isSameCell(afraidOf, guest)));
  });

  return panickedTableCells;
}

export function getScaryNeighbors(placedPersons: PlacedPerson[], person: PlacedPerson) {
  const neighbors = getNeighbors(placedPersons, person);
  return neighbors.filter((neighbor) => neighbor.name === person.phobia);
}

// get the 3 neighbors on the same table
export function getNeighbors(placedPersons: PlacedPerson[], self: CellPositionWithTableIndex): PlacedPerson[] {
  const { row, column } = self;

  const neighbors: PlacedPerson[] = placedPersons.filter((person) => {
    const isOpposite = person.row === row && person.column !== column && person.tableIndex === self.tableIndex;
    const isAbove = person.row === row - 1 && person.column === column && person.tableIndex === self.tableIndex;
    const isBelow = person.row === row + 1 && person.column === column && person.tableIndex === self.tableIndex;

    return isAbove || isBelow || isOpposite;
  });

  return neighbors;
}

// get the 4 neighboring cells
export function getCellNeighbors<C extends CellPosition>(cells: C[], cell: C): C[] {
  const { row, column } = cell;

  return cells.filter((c) => {
    const isAbove = c.row === row - 1 && c.column === column;
    const isBelow = c.row === row + 1 && c.column === column;
    const isLeft = c.row === row && c.column === column - 1;
    const isRight = c.row === row && c.column === column + 1;

    return isAbove || isBelow || isLeft || isRight;
  });
}

export function getNearestTableCell(gameFieldData: GameFieldData, cell: CellPositionWithTableIndex) {
  const tableIndex = cell.tableIndex;
  const tableCells = getTableCells(gameFieldData, tableIndex);
  return tableCells.find((tableCell) => tableCell.row === cell.row);
}

export function isUnhappy(person: PlacedPerson): boolean {
  return !isHappy(person);
}

export function hasPanic(person: PlacedPerson): boolean {
  return person.hasPanic;
}

export function isHappy(person: PlacedPerson): boolean {
  return isAtTable(person) && !person.hasPanic && !person.triskaidekaphobia;
}

export function getHappyGuests(persons: PlacedPerson[]) {
  return persons.filter(isHappy);
}

export function getEmptyChairs(gameFieldData: GameFieldData, placedPersons: PlacedPerson[]) {
  return gameFieldData.allCells.filter((cell) => isEmptyChair(placedPersons, cell));
}

export function getHappyStats(persons: PlacedPerson[], waitingPersons: WaitingPerson[]) {
  const happyGuestList = getHappyGuests(persons);
  const happyGuests = happyGuestList.length;
  const totalGuests = persons.length + waitingPersons.length;
  const hasWon = happyGuests === totalGuests;

  return {
    happyGuests,
    totalGuests,
    hasWon,
  };
}

export function getTableCells(gameFieldData: GameFieldData, tableIndex: number) {
  return gameFieldData.allCells.filter((cell) => isTable(cell) && cell.tableIndex === tableIndex);
}

export function getGuestsOnTable(placedPersons: PlacedPerson[], tableIndex: number): PlacedPerson[] {
  return placedPersons.filter((person) => person.tableIndex === tableIndex);
}
