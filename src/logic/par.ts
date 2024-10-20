import { isSameCell, PlacedPerson, pushCellIfNotInList } from "../types";
import { getNeighbors } from "./checks";
import { hasTablePhobia } from "../phobia";

export function getChainsAndSplitToTables(placedPersons: PlacedPerson[]): TableSplit[] {
  const personsWithBigFear = placedPersons.filter((p) => p.phobia !== undefined);
  const personsThatTriggerBigFear = placedPersons.filter((p) => personsWithBigFear.some((t) => t.phobia === p.name));
  const personsWithRelevantBigFear = personsWithBigFear.filter((p) => personsThatTriggerBigFear.some((t) => t.name === p.phobia));
  let involvedPersons = personsWithRelevantBigFear.concat(personsThatTriggerBigFear);

  const chains: TableSplit[] = [];
  while (involvedPersons.length > 0) {
    const chain: TableSplit = [[], []];
    const relatedPersons = [involvedPersons.pop()];
    while (relatedPersons.length > 0) {
      const currentPerson = relatedPersons.pop();
      const canAddToTable0 = canAddToTable(chain[0], currentPerson);
      const tableToAddTo = canAddToTable0 ? chain[0] : chain[1];
      pushCellIfNotInList(currentPerson, tableToAddTo);
      relatedPersons.push(...involvedPersons.filter((p) => p.name === currentPerson.phobia || p.phobia === currentPerson.name));
      involvedPersons = involvedPersons.filter((p) => !relatedPersons.some((t) => isSameCell(t, p)));
    }
    chains.push(chain);
  }

  return chains;
}

export function simplifiedCalculateParViaChains(placedPersons: PlacedPerson[]): number {
  const tableSplits = getChainsAndSplitToTables(placedPersons);
  let par = 0;
  const personsWithOnlySmallFearTriggered = getPersonsWithRegularPhobiaTriggered(placedPersons).length;

  for (let tables of tableSplits) {
    console.debug("Tables", tables);
    const variant1MismatchCount = getMismatchCount(tables, 0, 1);
    const variant2MismatchCount = getMismatchCount(tables, 1, 0);

    par += Math.min(variant1MismatchCount, variant2MismatchCount);
  }

  console.debug("Par from chains", par);
  console.debug("Persons with regular phobia triggered", personsWithOnlySmallFearTriggered);

  return par + personsWithOnlySmallFearTriggered;
}

function getPersonsWithRegularPhobiaTriggered(placedPersons: PlacedPerson[]): PlacedPerson[] {
  return placedPersons.filter((p) => {
    if (hasTablePhobia(p)) {
      return false;
    }

    const neighbors = getNeighbors(placedPersons, p);
    return neighbors.some((n) => n.name === p.phobia);
  });
}

function getMismatchCount(tables: TableSplit, index0: 0 | 1, index1: 0 | 1): number {
  const mismatchCount0 = tables[0].filter((p) => p.tableIndex !== index0).length;
  const mismatchCount1 = tables[1].filter((p) => p.tableIndex !== index1).length;

  return mismatchCount0 + mismatchCount1;
}

type TableSplit = [PlacedPerson[], PlacedPerson[]];

function canAddToTable(table: PlacedPerson[], person: PlacedPerson): boolean {
  return table.every((t) => t.name !== person.phobia && t.phobia !== person.name);
}
