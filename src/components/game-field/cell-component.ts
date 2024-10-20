import {
  BasePerson,
  Cell,
  CellPositionWithTableIndex,
  findPerson,
  hasPerson,
  isAtTable,
  isChair,
  isTable,
  PlacedPerson,
} from "../../types";
import { createElement } from "../../utils/html-utils";
import { getNearestTableCell, isHappy } from "../../logic/checks";
import { globals } from "../../globals";
import { CssClass } from "../../utils/css-class";
import { hasTablePhobia, PhobiaSvgMap } from "../../phobia";

export function createCellElement(cell: Cell | undefined, isOnTheRightOfATable: boolean = false): HTMLElement {
  const cellElem = createElement({
    cssClass: CssClass.CELL,
  });

  if (!cell) {
    return cellElem;
  }

  if (isTable(cell)) {
    cellElem.classList.add(CssClass.TABLE);

    const plateElem1 = createElement({
      cssClass: CssClass.PLATE,
      text: "🍽️",
    });
    const plateElem2 = createElement({
      cssClass: CssClass.PLATE,
      text: "🍽️",
    });

    cellElem.append(plateElem1);
    cellElem.append(plateElem2);
  }

  if (isChair(cell)) {
    cellElem.classList.add(CssClass.CHAIR);

    if (isOnTheRightOfATable) {
      cellElem.classList.add(CssClass.RIGHT);
    }
  }

  return cellElem;
}

export function updateCellOccupancy(
  cell: CellPositionWithTableIndex,
  cellElement: HTMLElement,
  getCellElement: (cell: CellPositionWithTableIndex) => HTMLElement,
  skipUpdatePanic: boolean = false,
): void {
  const person: PlacedPerson | undefined = findPerson(globals.placedPersons, cell);

  if (person && hasPerson(globals.placedPersons, cell)) {
    const personElement: HTMLElement = person.personElement;
    cellElement.append(personElement);

    if (!skipUpdatePanic) updatePersonPanicState(person, personElement);
  }

  cellElement.classList.toggle(CssClass.HAS_PERSON, !!person);

  const nearestTableCell = getNearestTableCell(globals.gameFieldData, cell);

  if (nearestTableCell && isAtTable(cell)) {
    const classToToggle = nearestTableCell.column < cell.column ? CssClass.HAS_RIGHT : CssClass.HAS_LEFT;
    if (nearestTableCell) {
      getCellElement(nearestTableCell).classList.toggle(classToToggle, !!person);
    }
  }
}

export function updatePersonPanicState(person: PlacedPerson, personElement: HTMLElement = person.personElement): void {
  const hasPanic = !isHappy(person);
  personElement.classList.toggle(CssClass.PANIC, hasPanic);
  personElement.classList.toggle(CssClass.P_T13A, person.triskaidekaphobia && !person.hasPanic);
}

export function createPersonElement(person: BasePerson): HTMLElement {
  const personElem = createElement({
    cssClass: CssClass.PERSON,
  });

  const personTextElem = createElement({
    tag: "span",
    cssClass: CssClass.EMOJI + " " + person.name,
  });

  personTextElem.append(PhobiaSvgMap[person.name].cloneNode(true));

  personElem.append(personTextElem);

  if (person.phobia) {
    const phobiaElem = createElement({ cssClass: `phobia ${person.phobia} ${hasTablePhobia(person) ? "table-phobia" : ""}` });
    phobiaElem.append(PhobiaSvgMap[person.phobia].cloneNode(true));
    personElem.append(phobiaElem);
  }

  return personElem;
}
