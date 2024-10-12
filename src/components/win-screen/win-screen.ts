import "./win-screen.scss";

import { createDialog, Dialog } from "../dialog/dialog";
import { createButton, createElement } from "../../utils/html-utils";
import { getTranslation, TranslationKey } from "../../translations/i18n";
import { newGame } from "../../logic/game-logic";
import { getOnboardingData, increaseOnboardingStepIfApplicable, isOnboarding } from "../../logic/onboarding";
import {
  difficulties,
  difficultyEmoji,
  getDifficultyStats,
  getDifficultyText,
  setDifficulty,
  setDifficultyStats,
} from "../../logic/difficulty";
import { globals } from "../../globals";

let winDialog: Dialog | undefined;
let difficultyElement: HTMLElement | undefined;

export function createWinScreen(score: number, isComplete: boolean) {
  if (!winDialog) {
    const winContentElem = getWinScreenContent(score, isComplete);

    winDialog = createDialog(winContentElem, getConfirmText(isComplete));
  } else {
    winDialog.recreateDialogContent(getWinScreenContent(score, isComplete));
    updateConfirmText(isComplete);
  }

  difficultyElement?.classList.toggle("hidden", isOnboarding());

  winDialog.open().then((playAgain) => {
    if (playAgain) {
      if (isComplete || globals.isWon) {
        increaseOnboardingStepIfApplicable();
      }
      newGame();
    }
  });
}

function updateConfirmText(isComplete: boolean) {
  winDialog?.changeSubmitText(getConfirmText(isComplete));
}

function getConfirmText(isComplete: boolean) {
  if (getOnboardingData()) {
    return isComplete || globals.isWon ? getTranslation(TranslationKey.CONTINUE) : getTranslation(TranslationKey.NEW_GAME);
  }

  return `${getTranslation(TranslationKey.NEW_GAME)} <span class="emoji-font">${difficultyEmoji[globals.difficulty]}</span>`;
}

function getWinScreenContent(score: number, isComplete: boolean) {
  if (isComplete && !isOnboarding()) {
    setDifficultyStats(globals.difficulty, score);
  }

  const winContentElem = createElement({
    cssClass: "menu",
  });

  if (isComplete || globals.isWon) {
    const scoreText = isOnboarding() ? "" : `<br/>${score}<span class="emoji-font">⭐️</span>`;

    winContentElem.innerHTML = `<span>${getTranslation(TranslationKey.WIN)} <span class="emoji-font">🎉</span>${scoreText}</span>`;
  } else {
    winContentElem.innerHTML = getTranslation(TranslationKey.NEW_GAME);
  }

  difficultyElement = createElement({
    cssClass: "d8y",
  });

  winContentElem.append(difficultyElement);

  for (let difficulty of difficulties) {
    const inner = createElement({});

    const btn = createButton({
      onClick: () => {
        setDifficulty(difficulty);
        updateConfirmText(isComplete);
        winDialog?.close(true);
      },
    });
    btn.innerHTML = `<span class="emoji-font">${difficultyEmoji[difficulty]}</span> ${getDifficultyText(difficulty)}`;

    const stats = getDifficultyStats(difficulty);

    const high = createElement({
      cssClass: "high",
    });

    high.innerHTML = `${getTranslation(TranslationKey.HIGHSCORE)} ${stats.highscore}<span class="emoji-font">⭐️</span> – ${getTranslation(TranslationKey.AVERAGE)} ${stats.average}<span class="emoji-font">⭐️</span>`;

    inner.append(btn, high);
    difficultyElement.append(inner);
  }

  return winContentElem;
}
