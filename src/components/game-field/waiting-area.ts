import { createElement } from "../../utils/html-utils";

import "./waiting-area.scss";
import { CssClass } from "../../utils/css-class";

let waitingAreaElement: HTMLElement;

export function getWaitingAreaElement(count: number, cellClickHandler: (index: number) => void, rowCount: number = 1): HTMLElement {
  if (!waitingAreaElement) {
    waitingAreaElement = createElement({
      cssClass: "waiting-area",
    });
  }

  for (let row = 0; row < rowCount; row++) {
    const rowElement = createElement({
      cssClass: "row",
    });

    for (let col = 0; col < count; col++) {
      const column = createElement({
        cssClass: CssClass.CELL,
        onClick: () => cellClickHandler(col),
      });
      rowElement.append(column);
    }

    waitingAreaElement.append(rowElement);
  }

  return waitingAreaElement;
}
