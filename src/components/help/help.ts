import "./help.scss";

import { createElement } from "../../utils/html-utils";
import { getTranslation, TranslationKey } from "../../translations/i18n";
import { Cell, CellType, isBasePerson, isChair, isEmpty, isPlacedPerson, isTable, PlacedPerson, WaitingPerson } from "../../types";
import { hasTablePhobia, Phobia, PhobiaSvgMap } from "../../phobia";
import { createCellElement } from "../game-field/cell-component";
import { getGuestsOnTable } from "../../logic/checks";
import { globals } from "../../globals";

import { CssClass } from "../../utils/css-class";

interface HappyStat {
  phobia: Phobia | CellType.CHAIR | "😱";
  satisfied: boolean;
  explainText: string;
  svg?: SVGElement;
}

export function getMiniHelpContent(cellOrPerson?: Cell | PlacedPerson | WaitingPerson): HTMLElement {
  // const name = (cell?.person?.name ?? cell?.type ?? "<?>") || "[ ]";
  const isEmptyState = !cellOrPerson;

  const miniHelpContent = createElement({
    cssClass: CssClass.HELP,
  });

  const helpText = createElement({});

  if (isEmptyState) {
    const exampleHeading = createElement({
      tag: "h3",
      text: getTranslation(TranslationKey.WELCOME),
      cssClass: CssClass.WELCOME,
    });

    const goalText = getTranslation(TranslationKey.GOAL);

    const helpTexts = [goalText, getTranslation(TranslationKey.INFO_PLACEHOLDER)];

    helpText.innerHTML = helpTexts.map((text) => `<p>${text}</p>`).join("");

    miniHelpContent.append(exampleHeading, helpText);

    const placeholder = createElement({
      cssClass: CssClass.CELL,
      text: "?",
    });

    miniHelpContent.append(placeholder);

    return miniHelpContent;
  }

  let helpCellElement: HTMLElement | undefined;
  let statsElem: HTMLElement | undefined;

  if (isBasePerson(cellOrPerson)) {
    statsElem = getSatisfactionStats(cellOrPerson);

    helpCellElement = createCellElement(undefined);
    const personElement = cellOrPerson.personElement.cloneNode(true) as HTMLElement;
    personElement.classList.remove(CssClass.SELECTED);
    helpCellElement.append(personElement);
    helpCellElement.classList.toggle(CssClass.HAS_PERSON, true);
    helpCellElement.classList.toggle(CssClass.CHAIR, isPlacedPerson(cellOrPerson) && cellOrPerson.tableIndex !== undefined);
  } else {
    helpCellElement = createCellElement(cellOrPerson);

    if (isTable(cellOrPerson)) {
      const tableIndex = cellOrPerson.tableIndex ?? 0;
      const numChairs = globals.gameFieldData.tableAssignments[tableIndex].chairCells.length;
      const occupancy = getGuestsOnTable(globals.placedPersons, tableIndex).length;

      const helpTexts = [
        getTranslation(TranslationKey.INFO_TABLE, tableIndex + 1),
        getTranslation(TranslationKey.INFO_TABLE_OCCUPANCY, occupancy, numChairs) + " <span class='emoji-font'>🪑</span>",
      ];

      if (occupancy === 13) {
        helpTexts.push("<span class='emoji-font'>😱😱😱</span>");
        helpTexts.push(getTranslation(TranslationKey.INFO_TRISKAIDEKAPHOBIA));
        helpCellElement.classList.add(CssClass.T13A);
      }

      helpText.innerHTML = helpTexts.map((text) => `<p>${text}</p>`).join("");
    } else {
      helpText.innerHTML = getTranslation(
        isChair(cellOrPerson.type)
          ? TranslationKey.INFO_CHAIR
          : isEmpty(cellOrPerson)
            ? TranslationKey.INFO_EMPTY
            : TranslationKey.INFO_DECOR,
      );
    }
  }

  if (helpCellElement) {
    miniHelpContent.append(helpCellElement);
  }

  if (statsElem) {
    miniHelpContent.append(statsElem);
  }

  miniHelpContent.append(helpText);

  return miniHelpContent;
}

function getSatisfactionStats(person: PlacedPerson | WaitingPerson): HTMLElement {
  let isTriskaidekaphobia = false;
  let hasTable = false;
  let phobiaNotTriggered = undefined;

  if (isPlacedPerson(person)) {
    isTriskaidekaphobia = person.triskaidekaphobia;
    hasTable = person.tableIndex !== undefined;
    phobiaNotTriggered = !hasTable ? undefined : !person.hasPanic;
  }

  const satisfactionStats = createElement({
    cssClass: CssClass.STATS,
  });

  const statsGrid = createElement({
    cssClass: CssClass.STATS_GRID,
  });

  const isTablePhobia = hasTablePhobia(person);

  const stats: HappyStat[] = [
    {
      phobia: isTriskaidekaphobia ? "😱" : undefined,
      satisfied: !isTriskaidekaphobia,
      explainText: getTranslation(TranslationKey.INFO_TRISKAIDEKAPHOBIA),
    },
    {
      phobia: person.phobia,
      satisfied: phobiaNotTriggered,
      explainText: getTranslation(
        isTablePhobia ? TranslationKey.INFO_TABLE_PHOBIA : TranslationKey.INFO_REGULAR_FEAR,
        '<span class="svg"></span>',
      ),
      svg: PhobiaSvgMap[person.phobia],
    },
    { phobia: CellType.CHAIR, satisfied: hasTable, explainText: getTranslation(TranslationKey.INFO_FOMO) },
  ];

  stats
    .filter(({ phobia }) => !!phobia)
    .forEach(({ phobia, satisfied, explainText, svg }) => {
      const stat = createElement({
        cssClass: `${CssClass.STAT} ${satisfied !== undefined ? (satisfied ? CssClass.GOOD : CssClass.BAD) : ""}`,
      });

      const elems = [satisfied !== undefined ? (satisfied ? "✔" : "X") : "?", explainText];

      if (phobia === CellType.CHAIR) {
        elems[1] += ' <span class="emoji-font">🍽️</span>';
      }

      stat.innerHTML = elems.map((content) => `<span>${content}</span>`).join("");

      if (svg) {
        stat.querySelector(".svg")?.append(svg.cloneNode(true));
        stat.querySelector(".svg")?.classList.add(CssClass.EMOJI, phobia);
      }

      statsGrid.append(stat);
    });

  satisfactionStats.append(statsGrid);

  return satisfactionStats;
}
