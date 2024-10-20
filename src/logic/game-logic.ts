import { Cell, PlacedPerson, WaitingPerson } from "../types";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";
import { globals } from "../globals";

export function newGame() {
  pubSubService.publish(PubSubEvent.NEW_GAME);
}

export function movePerson(person: PlacedPerson, toCell: Cell) {
  person.column = toCell.column;
  person.row = toCell.row;
  person.tableIndex = toCell.tableIndex;
}

export function placePersonOnField(person: WaitingPerson, targetCell: Cell): PlacedPerson {
  const placedPerson: PlacedPerson = {
    ...person,
    hasPanic: false,
    triskaidekaphobia: false,
    afraidOf: [],
    makesAfraid: [],
    row: targetCell.row,
    column: targetCell.column,
    tableIndex: targetCell.tableIndex,
  };

  globals.waitingPersons = globals.waitingPersons.filter((p) => p.id !== person.id);
  globals.placedPersons.push(placedPerson);

  return placedPerson;
}

export function transformPlacedPersonToWaitingPerson(person: PlacedPerson): WaitingPerson {
  return {
    id: person.id,
    name: person.name,
    phobia: person.phobia,
    personElement: person.personElement,
  };
}
