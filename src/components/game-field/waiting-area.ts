import { createElement } from "../../utils/html-utils";

import "./waiting-area.scss";
import { CssClass } from "../../utils/css-class";

let waitingAreaElement: HTMLElement;
let waitlistHandledCount = 0;
let visibleCount = 0;
const lengthWithBuffer = 32;

export function getWaitingAreaElement(count: number, cellClickHandler: () => void): HTMLElement {
  waitingAreaElement?.remove();
  waitingAreaElement = createElement({
    cssClass: "waiting-area",
  });

  visibleCount = count;

  for (let col = 0; col < lengthWithBuffer; col++) {
    const cell = createElement({
      cssClass: `${CssClass.CELL} ${col >= visibleCount ? "outside" : ""}`,
      onClick: () => cellClickHandler(),
    });
    cell.style.setProperty("--index", col.toString());
    waitingAreaElement.append(cell);
  }

  return waitingAreaElement;
}

export function resetWaitlist(): void {
  waitlistHandledCount = 0;
  waitingAreaElement?.style.setProperty("--removed-count", "0");
  waitingAreaElement?.children;
  for (let col = 0; col < lengthWithBuffer; col++) {
    const cell = waitingAreaElement?.children[col];
    cell?.classList.toggle("outside", col >= visibleCount);
  }
}

export function updateWaitlistCount(): void {
  waitlistHandledCount++;

  waitingAreaElement?.children[visibleCount + waitlistHandledCount - 1]?.classList.remove("outside");
  waitingAreaElement?.style.setProperty("--removed-count", waitlistHandledCount.toString());
}
