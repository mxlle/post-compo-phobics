import { createElement } from "../../utils/html-utils";

import "./waiting-area.scss";
import { CssClass } from "../../utils/css-class";
import { globals } from "../../globals";

let waitingAreaElement: HTMLElement;
let doorCountElement: HTMLElement;
let waitlistHandledCount = 0;
let visibleCount = 0;
const lengthWithBuffer = 32;

export function getWaitingAreaElement(count: number, cellClickHandler: () => void): HTMLElement {
  waitingAreaElement?.remove();
  waitingAreaElement = createElement({
    cssClass: "waiting-area",
  });

  visibleCount = count - 1;

  for (let col = 0; col < lengthWithBuffer; col++) {
    const cell = createElement({
      cssClass: `${CssClass.CELL} ${col >= visibleCount ? "outside outer" : ""}`,
      onClick: () => cellClickHandler(),
    });
    cell.style.setProperty("--index", (col + 1).toString());
    waitingAreaElement.append(cell);
  }

  const doorElement = createElement({
    text: `🚪 `,
    cssClass: `${CssClass.CELL} door emoji-font`,
    onClick: () => cellClickHandler(),
  });
  doorCountElement = createElement({ tag: "span", cssClass: "count", text: formatNumber(0) });
  doorElement.append(doorCountElement);
  waitingAreaElement.append(doorElement);

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
  doorCountElement && (doorCountElement.innerText = formatNumber(0));
}

export function setDoorCount(count = globals.waitingPersons.length): void {
  doorCountElement && (doorCountElement.innerText = formatNumber(count));
}

export function updateWaitlistCount(): void {
  waitlistHandledCount++;

  waitingAreaElement?.children[visibleCount + waitlistHandledCount - 1]?.classList.remove("outside");
  waitingAreaElement?.style.setProperty("--removed-count", waitlistHandledCount.toString());
  setDoorCount();
}

function formatNumber(num: number): string {
  return ("" + (100 + num)).substring(1);
}
