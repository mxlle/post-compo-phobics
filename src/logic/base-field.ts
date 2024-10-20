import { Cell, CellType, GameFieldData, getCellTypesWithoutPrefix, isChair, isSameCell, isTable, TableAssignment } from "../types";
import { getCellNeighbors } from "./checks";

export const baseField2 = (() => {
  const { _, T, c } = getCellTypesWithoutPrefix();
  return [
    [c, T, c, _, _, c, T, c],
    [c, T, c, _, _, c, T, c],
    [c, T, c, _, _, c, T, c],
    [c, T, c, _, _, c, T, c],
    [c, T, c, _, _, c, T, c],
    [c, T, c, _, _, c, T, c],
    [c, T, c, _, _, c, T, c],
    [c, T, c, _, _, c, T, c],
  ];
})();

export const baseField = (() => {
  const { _, T, c } = getCellTypesWithoutPrefix();
  return [
    [c, T, c, _, c, T, c],
    [c, T, c, _, c, T, c],
    [c, T, c, _, c, T, c],
    [_, _, _, _, _, _, _],
    [c, T, c, _, c, T, c],
    [c, T, c, _, c, T, c],
    [c, T, c, _, c, T, c],
  ];
})();

export function getGameFieldDataFromBaseField(baseField: CellType[][]): GameFieldData {
  const field: Cell[][] = [];

  for (let row = 0; row < baseField.length; row++) {
    const rowArray: Cell[] = [];

    for (let column = 0; column < baseField[row].length; column++) {
      const cellType = baseField[row][column];
      const cell: Cell = { row, column, type: cellType };
      rowArray.push(cell);
    }

    field.push(rowArray);
  }

  const allCells = field.flat();
  const tables = splitIntoTables(allCells);
  const tableAssignments: TableAssignment[] = tables.map((tableGroup, index) => {
    const tableCells = tableGroup.filter((c) => isTable(c.type));
    const chairCells = tableGroup.filter((c) => isChair(c.type));
    const tableColumns = tableCells.map((c) => c.column);
    const firstTableCell = tableCells.find((tableCell) => tableCell.column === Math.min(...tableColumns))!;

    return {
      tableIndex: index,
      firstTableCell,
      tableCells,
      chairCells,
    };
  });

  return {
    allCells,
    field,
    tableAssignments,
  };
}

function splitIntoTables(cells: Cell[]): Cell[][] {
  const chairAndTableCells = cells.filter((c) => isChair(c.type) || isTable(c.type));
  const tables: Cell[][] = [];

  for (let i = 0; i < chairAndTableCells.length; i++) {
    const cell = chairAndTableCells[i];

    const tableIndex = tables.findIndex((table) => table.some((c) => isSameCell(c, cell)));

    if (tableIndex !== -1) {
      cell.tableIndex = tableIndex;
      continue;
    }

    const tableGroup = getNeighborsRecursively(chairAndTableCells, cell, [cell]);
    tableGroup.forEach((c) => (c.tableIndex = tables.length));
    tables.push(tableGroup);
  }

  return tables;
}

function getNeighborsRecursively(cells: Cell[], cell: Cell, neighbors: Cell[]): Cell[] {
  const newNeighbors = getCellNeighbors(cells, cell).filter((c) => !neighbors.some((n) => isSameCell(n, c)));
  neighbors.push(...newNeighbors);

  for (let neighbor of newNeighbors) {
    getNeighborsRecursively(cells, neighbor, neighbors);
  }

  return neighbors;
}
