import { Phobia } from "./phobia";

export interface GameMetaData {
  minMoves: number;
  maxMoves: number;
}

export const enum CellType {
  EMPTY = "",
  TABLE = "🟫",
  CHAIR = "🪑",
}

export interface Settings {
  minAmount: number;
  maxAmount: number;
  chanceForBigFear: number;
  chanceForSmallFear: number;
  minInitialPanic: number;
}

interface CellPosition {
  row: number;
  column: number;
}

export interface Cell extends CellPosition {
  type: CellType;
  tableIndex?: number;
}

export interface BasePerson {
  id: number;
  name: Phobia;
  fear: Phobia | undefined;
  smallFear: Phobia | undefined;
}

export interface Person extends BasePerson {
  hasPanic: boolean;
  triskaidekaphobia: boolean;
  afraidOf: PlacedPerson[];
  makesAfraid: PlacedPerson[];
  personElement: HTMLElement;
}

export interface CellPositionWithTableIndex extends CellPosition {
  tableIndex?: number;
}

export interface PlacedPerson extends Person, CellPositionWithTableIndex {}

export interface WaitingPerson extends BasePerson {
  personElement: HTMLElement;
}

export function isBasePerson(potentialPerson: unknown): potentialPerson is BasePerson {
  return typeof potentialPerson === "object" && potentialPerson !== null && "name" in potentialPerson;
}

export function isPlacedPerson(person: BasePerson): person is PlacedPerson {
  return "row" in person && "hasPanic" in person;
}

export interface PersonWithPosition extends BasePerson, CellPosition {}

export type GameFieldData = Cell[][];

export interface GameData {
  gameFieldData: GameFieldData;
  placedPersons: PlacedPerson[];
  settings?: Settings;
  metaData?: GameMetaData;
}

// type helpers

const getType = (typeOrObject: string | Cell) => (typeof typeOrObject === "string" ? typeOrObject : typeOrObject.type);

export const isTable = (typeOrObject: string | Cell) => getType(typeOrObject) === CellType.TABLE;
export const isChair = (typeOrObject: string | Cell) => getType(typeOrObject) === CellType.CHAIR;
export const isEmpty = (typeOrObject: string | Cell) => getType(typeOrObject) === CellType.EMPTY;

export function isEmptyChair(placedPersons: PlacedPerson[], cell: Cell): boolean {
  return isChair(cell) && !hasPerson(placedPersons, cell);
}

export function isAtTable(cell: CellPositionWithTableIndex): boolean {
  return cell.tableIndex !== undefined;
}

export function hasPerson(placedPersons: PlacedPerson[], cell: CellPosition): boolean {
  return placedPersons.some((p) => isSameCell(p, cell));
}

export function findPerson(placedPersons: PlacedPerson[], cell: CellPosition): PlacedPerson | undefined {
  return placedPersons.find((p) => isSameCell(p, cell));
}

export function findPersonFromElement(
  placedPersons: PlacedPerson[],
  waitingPersons: WaitingPerson[],
  element: HTMLElement,
): PlacedPerson | WaitingPerson | undefined {
  const person = placedPersons.find((p) => p.personElement === element);
  if (person) {
    return person;
  }
  return waitingPersons.find((p) => p.personElement === element);
}

export function isSameCell(cell1: CellPosition, cell2: CellPosition) {
  return cell1.row === cell2.row && cell1.column === cell2.column;
}

export function pushCellIfNotInList(cell: CellPosition, list: CellPosition[]) {
  if (!list.find((c) => isSameCell(c, cell))) {
    list.push(cell);
  }
}

export function getCellTypesWithoutPrefix() {
  return {
    _: CellType.EMPTY,
    T: CellType.TABLE,
    c: CellType.CHAIR,
  };
}

export function getGameFieldCopy(gameFieldData: GameFieldData): GameFieldData {
  return JSON.parse(JSON.stringify(gameFieldData));
}
