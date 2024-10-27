import "./game-field.scss";

import { createButton, createElement } from "../../utils/html-utils";
import { movePerson, newGame, placePersonOnField } from "../../logic/game-logic";
import {
  Cell,
  CellPositionWithTableIndex,
  findPerson,
  findPersonFromElement,
  GameFieldData,
  hasPerson,
  isPlacedPerson,
  isSameCell,
  isTable,
  PlacedPerson,
  WaitingPerson,
} from "../../types";
import { createWinScreen } from "../win-screen/win-screen";
import { createCellElement, updateCellOccupancy, updatePersonPanicState } from "./cell-component";
import { getTranslation, TranslationKey } from "../../translations/i18n";
import { globals } from "../../globals";
import { requestAnimationFrameWithTimeout } from "../../utils/promise-utils";
import { getGameFieldData, placePersonsInitially } from "../../logic/initialize";
import { checkTableStates, getChairNeighbors, getHappyStats } from "../../logic/checks";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { handlePokiCommercial, pokiSdk } from "../../poki-integration";
import { getOnboardingData, increaseOnboardingStepIfApplicable, isOnboarding, wasOnboarding } from "../../logic/onboarding";
import { getMiniHelpContent } from "../help/help";
import { Direction, getOnboardingArrow } from "../onboarding/onboarding-components";
import { calculateScore } from "../../logic/score";
import initDragDrop from "../../utils/drag-drop";
import { CssClass } from "../../utils/css-class";
import { getWaitingAreaElement, resetWaitlist, setDoorCount, updateWaitlistCount } from "./waiting-area";
import { hasTablePhobia } from "../../phobia";

let mainContainer: HTMLElement | undefined;
let gameFieldElem: HTMLElement | undefined;
let startButton: HTMLElement | undefined;
let miniHelp: HTMLElement | undefined;
let waitingArea: HTMLElement | undefined;
let onboardingArrow: HTMLElement | undefined;
let selectedPerson: PlacedPerson | WaitingPerson | undefined;
let lastClickedCell: Cell | undefined;
let hasMadeFirstMove = false;
let moves: number = 0;
const cellElements: HTMLElement[][] = [];

const TIMEOUT_BETWEEN_GAMES = 300;
const TIMEOUT_CELL_APPEAR = 20;

export async function initializeEmptyGameField() {
  document.body.classList.remove(CssClass.SELECTING);

  const baseData = getGameFieldData();

  if (gameFieldElem) {
    console.error("initialize function should only be called once");
    return;
  }

  gameFieldElem = generateGameFieldElement(baseData);

  addStartButton(TranslationKey.START_GAME);

  appendGameField();
}

function addStartButton(buttonLabelKey: TranslationKey) {
  startButton = createButton({
    text: getTranslation(buttonLabelKey),
    onClick: (event: MouseEvent) => {
      if (isOnboarding()) {
        increaseOnboardingStepIfApplicable();
      }
      newGame();
      (event.target as HTMLElement)?.remove();
    },
  });
  startButton.classList.add(CssClass.START_BUTTON, "prm");
  gameFieldElem.append(startButton);
}

export async function startNewGame() {
  document.body.classList.remove(CssClass.SELECTING, CssClass.WON);
  globals.isWon = false;
  startButton?.remove();
  hasMadeFirstMove = false;
  selectedPerson = undefined;
  lastClickedCell = undefined;
  moves = 0;
  updateMiniHelp();

  if (globals.gameFieldData && gameFieldElem) {
    // reset old game field
    pubSubService.publish(PubSubEvent.UPDATE_SCORE, { score: 0, moves: 0, par: 0 });
    await cleanGameField(globals.gameFieldData);
    if (process.env.POKI_ENABLED === "true") await handlePokiCommercial();
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);

    if (wasOnboarding()) {
      console.debug("Was onboarding, removing game field");
      gameFieldElem.remove();
      gameFieldElem = undefined;
      waitingArea.remove();
      waitingArea = undefined;
      globals.gameFieldData = undefined;
    }
  }

  console.debug("Starting new game, onboarding step", globals.onboardingStep);

  if (!globals.gameFieldData) {
    globals.gameFieldData = getGameFieldData();
  }

  placePersonsInitially(globals.gameFieldData);

  if (!gameFieldElem) {
    gameFieldElem = generateGameFieldElement(globals.gameFieldData);
    appendGameField();
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  await initializePersonsOnGameField();

  addOnboardingArrowIfApplicable();

  await updateState(globals.gameFieldData, globals.placedPersons, globals.waitingPersons, true);
}

function appendGameField() {
  if (!gameFieldElem) {
    console.warn("No game field element to append");
    return;
  }

  if (!mainContainer) {
    mainContainer = createElement({
      tag: "main",
    });
    document.body.append(mainContainer);
  }

  attachWaitingArea(globals.gameFieldData.field.length);

  mainContainer.append(gameFieldElem);

  setupDragDrop();

  updateMiniHelp();
}

function checkForFirstMove() {
  if (!hasMadeFirstMove) {
    hasMadeFirstMove = true;
    console.debug("First move made");
    if (process.env.POKI_ENABLED === "true") pokiSdk.gameplayStart();
  }
}

function cellClickHandler(cell: Cell) {
  console.debug("Cell clicked", cell);

  checkForFirstMove();

  const cellHasPerson = hasPerson(globals.placedPersons, cell);

  if (!cellHasPerson && lastClickedCell && isSameCell(cell, lastClickedCell)) {
    updateMiniHelp();
    lastClickedCell = undefined;
  } else {
    if (!selectedPerson) {
      updateMiniHelp(cell);
    }
    lastClickedCell = cell;
  }

  if (!cellHasPerson) {
    if (!selectedPerson || isTable(cell)) {
      return;
    }
  }

  const person = findPerson(globals.placedPersons, cell);

  if (selectedPerson) {
    if (isPlacedPerson(selectedPerson) && isSameCell(selectedPerson, cell)) {
      resetSelection();
      updateStateForSelection(globals.placedPersons, selectedPerson); // todo - selectedPerson is not defined
      return;
    }

    if (person) {
      selectPerson(person);
      return;
    }

    void performMove(selectedPerson, cell);
  } else {
    selectPerson(person);
  }
}

function selectPerson(person: PlacedPerson | WaitingPerson) {
  if (selectedPerson) {
    selectedPerson.personElement.classList.remove(CssClass.SELECTED);
  }

  selectedPerson = person;
  updateStateForSelection(globals.placedPersons, selectedPerson);
  updateMiniHelp(person);
  document.body.classList.toggle(CssClass.SELECTING, true);
}

function waitingAreaCellClickHandler() {
  const waitingPerson = globals.waitingPersons[0];

  if (!waitingPerson || waitingPerson === selectedPerson) {
    resetSelection();
    updateStateForSelection(globals.placedPersons, undefined);

    return;
  }

  selectPerson(waitingPerson);
}

async function performMove(person: PlacedPerson | WaitingPerson, targetCell: Cell) {
  console.debug("Performing move", person, targetCell);

  if (isPlacedPerson(person)) {
    const previousCellElement = getCellElement(person);
    const prevCell = {
      row: person.row,
      column: person.column,
      tableIndex: person.tableIndex,
    };
    movePerson(person, targetCell);
    updateCellOccupancy(prevCell, previousCellElement, getCellElement);
  } else {
    selectedPerson = placePersonOnField(person, targetCell);
    updateWaitlistCount();
  }

  updateCellOccupancy(targetCell, getCellElement(targetCell), getCellElement);
  removeOnboardingArrowIfApplicable();
  moves++;
  const previousSelectedPerson = selectedPerson;
  resetSelection(true);
  const hasWon = await updateState(globals.gameFieldData, globals.placedPersons, globals.waitingPersons);
  updateMiniHelp(hasWon ? undefined : previousSelectedPerson);
}

function getCellElement(cell: CellPositionWithTableIndex): HTMLElement {
  return cellElements[cell.row]?.[cell.column];
}

function resetSelection(keepMiniHelp = false) {
  if (selectedPerson) {
    selectedPerson.personElement.classList.remove(CssClass.SELECTED);
    selectedPerson = undefined;
  }

  document.body.classList.remove(CssClass.SELECTING);

  if (!keepMiniHelp) {
    updateMiniHelp(undefined);
  }
}

function updateMiniHelp(cellOrPerson?: Cell | PlacedPerson | WaitingPerson) {
  if (miniHelp) {
    miniHelp.remove();
    miniHelp = undefined;
  }

  miniHelp = getMiniHelpContent(cellOrPerson);
  mainContainer?.append(miniHelp);
}

function attachWaitingArea(columnCount: number) {
  waitingArea = getWaitingAreaElement(columnCount, waitingAreaCellClickHandler);

  mainContainer?.append(waitingArea);
}

async function updateState(
  gameFieldData: GameFieldData,
  placedPersons: PlacedPerson[],
  waitingPersons: WaitingPerson[],
  skipWinCheck = false,
): Promise<boolean> {
  const panickedTableCells = checkTableStates(gameFieldData, placedPersons);
  await updatePanicStates(gameFieldData, placedPersons, panickedTableCells, waitingPersons);
  const score = calculateScore(placedPersons, moves);
  pubSubService.publish(PubSubEvent.UPDATE_SCORE, { score, moves, par: globals.metaData?.minMoves });
  const { hasWon } = getHappyStats(placedPersons, waitingPersons);
  waitingArea?.classList.toggle(CssClass.HAS_WAITING_PERSON, waitingPersons.length > 0);

  if (hasWon && !skipWinCheck) {
    globals.isWon = true;
    document.body.classList.add(CssClass.WON);
    createWinScreen(score, true);
    setTimeout(() => {
      addStartButton(isOnboarding() ? TranslationKey.CONTINUE : TranslationKey.NEW_GAME);
    }, 300);

    console.debug("Game won, score", score);
    if (process.env.POKI_ENABLED === "true") pokiSdk.gameplayStop();
  }

  return hasWon;
}

export function generateGameFieldElement(gameFieldData: GameFieldData) {
  const gameField = createElement({
    cssClass: CssClass.FIELD,
  });
  cellElements.length = 0;

  gameFieldData.field.forEach((row, rowIndex) => {
    const rowElements: HTMLElement[] = [];
    const rowElem = createElement({
      cssClass: "row",
    });
    gameField.append(rowElem);

    row.forEach((cell, columnIndex) => {
      const relatedTableAssignment = gameFieldData.tableAssignments.find((tableAssignment) => tableAssignment.tableCells.includes(cell));
      const isFirstTableCell = relatedTableAssignment && isSameCell(relatedTableAssignment.firstTableCell, cell);
      const leftNeighbor = columnIndex > 0 ? gameFieldData.field[rowIndex][columnIndex - 1] : undefined;
      const isOnTheRightOfATable = leftNeighbor ? isTable(leftNeighbor) : false;
      const cellElement = createCellElement(cell, isOnTheRightOfATable);

      cellElement.addEventListener("click", () => {
        cellClickHandler(cell);
      });

      if (relatedTableAssignment && isFirstTableCell) {
        cellElement.classList.add(CssClass.FIRST);
        cellElement.style.setProperty("--table-height", relatedTableAssignment.tableCells.length.toString());
      }

      rowElem.append(cellElement);
      rowElements.push(cellElement);
    });

    cellElements.push(rowElements);
  });

  return gameField;
}

function setupDragDrop() {
  initDragDrop(mainContainer, CssClass.PERSON, CssClass.CELL, createOverlayOnDragStart, onDrop, onDragCancel);

  function createOverlayOnDragStart(personElement: HTMLElement) {
    const person = findPersonFromElement(globals.placedPersons, globals.waitingPersons, personElement);

    console.debug("Dragging", person);

    selectPerson(person);
    // updateMiniHelp(cell); // todo - allow person as param
    mainContainer.classList.add(CssClass.IS_DRAGGING);
    personElement.classList.add(CssClass.IS_DRAGGED);
    const personElementClone = personElement.cloneNode(true) as HTMLElement;
    personElementClone.setAttribute("style", `width: ${personElement.offsetWidth}px; height: ${personElement.offsetHeight}px`);

    return personElementClone;
  }

  function onDrop(personElement: HTMLElement, dropEl: HTMLElement, _isTouch: boolean) {
    const person = findPersonFromElement(globals.placedPersons, globals.waitingPersons, personElement);
    mainContainer.classList.remove(CssClass.IS_DRAGGING);
    const dropCell = getElementCell(globals.gameFieldData, dropEl);
    personElement.classList.remove(CssClass.IS_DRAGGED);

    console.debug("Dropped", person, dropCell);

    if (dropCell && !isTable(dropCell) && !hasPerson(globals.placedPersons, dropCell)) {
      void performMove(person, dropCell);
    } else {
      onDragCancel(personElement);
    }
  }

  function onDragCancel(personElement: HTMLElement) {
    console.debug("Drag cancelled");

    mainContainer.classList.remove(CssClass.IS_DRAGGING);
    personElement.classList.remove(CssClass.IS_DRAGGED);
    // personElement.click();
  }
}

function getElementCell(gameFieldData: GameFieldData, el: HTMLElement): Cell | undefined {
  for (const row in cellElements) {
    const column = cellElements[row].indexOf(el);
    if (column !== -1) return gameFieldData.field[row][column];
  }
}

export async function initializePersonsOnGameField() {
  const waitingPersons = globals.waitingPersons;
  const sittingPersons = globals.placedPersons;

  for (let i = 0; i < waitingPersons.length; i++) {
    const person = waitingPersons[i];
    const cellElement = waitingArea?.children[i] as HTMLElement;
    cellElement.innerHTML = "";
    cellElement.append(person.personElement);
    setDoorCount(i + 1);
    if (i < globals.gameFieldData.field.length) {
      await requestAnimationFrameWithTimeout(TIMEOUT_CELL_APPEAR);
    }
  }

  for (let i = 0; i < sittingPersons.length; i++) {
    const person = sittingPersons[i];
    const cellElement = getCellElement(person);
    cellElement.innerHTML = "";
    updateCellOccupancy(person, cellElement, getCellElement, true);
    await requestAnimationFrameWithTimeout(TIMEOUT_CELL_APPEAR);
  }
}

function addOnboardingArrowIfApplicable() {
  const onboardingData = getOnboardingData();
  const waitingLength = onboardingData?.waitingPersons.length;

  if (waitingLength) {
    onboardingArrow = getOnboardingArrow(Direction.AUTO);
    const cellElement = waitingArea?.children[0]?.children[waitingLength - 1] as HTMLElement;
    cellElement.append(onboardingArrow);
  }
}

function removeOnboardingArrowIfApplicable() {
  if (!onboardingArrow) {
    return;
  }

  const hasOnboardingCellPerson = globals.waitingPersons.length;

  if (!hasOnboardingCellPerson) {
    onboardingArrow.remove();
    onboardingArrow = undefined;
  }
}

export async function cleanGameField(gameFieldData: GameFieldData) {
  for (let i = globals.waitingPersons.length - 1; i >= 0; i--) {
    const person = globals.waitingPersons[i];
    person.personElement.remove();
    setDoorCount(i);
    if (i < gameFieldData.field.length) {
      await requestAnimationFrameWithTimeout(TIMEOUT_CELL_APPEAR);
    }
  }

  resetWaitlist();

  for (let i = 0; i < gameFieldData.allCells.length; i++) {
    const cell: Cell = gameFieldData.allCells[i];
    const cellElement = getCellElement(cell);
    if (isTable(cell)) {
      cellElement.classList.remove(CssClass.T13A, CssClass.HAS_LEFT, CssClass.HAS_RIGHT);
    } else {
      const hadPerson = cellElement.classList.contains(CssClass.HAS_PERSON);

      cellElement.innerHTML = "";
      cellElement.classList.remove(CssClass.HAS_PERSON);

      if (hadPerson) {
        await requestAnimationFrameWithTimeout(TIMEOUT_CELL_APPEAR);
      }
    }
  }
}

export async function updatePanicStates(
  gameFieldData: GameFieldData,
  placedPersons: PlacedPerson[],
  panickedTableCells: Cell[],
  waitingPersons: WaitingPerson[],
) {
  placedPersons.forEach((person) => {
    person.personElement.classList.remove(CssClass.PANIC, CssClass.P_T13A, CssClass.SCARY, CssClass.SCARED, CssClass.NEXT);
  });

  gameFieldData.allCells.filter(isTable).forEach((cell) => {
    const cellElement = getCellElement(cell);
    cellElement.classList.remove(CssClass.T13A);
  });

  await requestAnimationFrameWithTimeout(150); // to trigger restart of tremble animation

  placedPersons.forEach((person) => {
    updatePersonPanicState(person);
  });

  panickedTableCells.forEach((cell) => {
    const cellElement = getCellElement(cell);
    cellElement.classList.add(CssClass.T13A);
  });

  waitingPersons[0]?.personElement.classList.add(CssClass.NEXT);
}

export function updateStateForSelection(placedPersons: PlacedPerson[], selectedPerson: PlacedPerson | WaitingPerson | undefined) {
  placedPersons.forEach((person) => {
    person.personElement.classList.remove(CssClass.SCARY, CssClass.SCARED, CssClass.SELECTED);
  });

  cellElements.forEach((row) => {
    row.forEach((cellElement) => {
      cellElement.classList.remove(CssClass.AFFECTED_BY, CssClass.SECONDARY_AFFECTED_BY);
    });
  });

  if (!selectedPerson) {
    return;
  }

  selectedPerson.personElement.classList.add(CssClass.SELECTED);

  placedPersons.forEach((person) => {
    if (person.phobia === selectedPerson.name) {
      person.personElement.classList.add(CssClass.SCARED);

      person.affectedBy.forEach((cell) => {
        const cellElement = getCellElement(cell);
        cellElement.classList.add(CssClass.SECONDARY_AFFECTED_BY);
      });
    } else if (person.name === selectedPerson.phobia) {
      person.personElement.classList.add(CssClass.SCARY);

      const tableAssignment = globals.gameFieldData.tableAssignments.find(
        (tableAssignment) => tableAssignment.tableIndex === person.tableIndex,
      );

      if (tableAssignment) {
        if (hasTablePhobia(selectedPerson)) {
          tableAssignment.chairCells.forEach((cell) => {
            const cellElement = getCellElement(cell);
            cellElement.classList.add(CssClass.SECONDARY_AFFECTED_BY);
          });
        } else {
          getChairNeighbors(tableAssignment, person).forEach((cell) => {
            const cellElement = getCellElement(cell);
            cellElement.classList.add(CssClass.SECONDARY_AFFECTED_BY);
          });
        }
      }
    }
  });

  if (!isPlacedPerson(selectedPerson)) {
    return;
  }

  selectedPerson.affectedBy.forEach((cell) => {
    const cellElement = getCellElement(cell);
    cellElement.classList.add(CssClass.AFFECTED_BY);
  });
}
