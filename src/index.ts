import "./index.scss";

import { createButton, createElement } from "./utils/html-utils";
import { PubSubEvent, pubSubService } from "./utils/pub-sub-service";
import { startNewGame } from "./components/game-field/game-field";
import { initAudio, togglePlayer } from "./audio/music-control";
import { getLocalStorageItem, LocalStorageKey } from "./utils/local-storage";
import { initPoki } from "./poki-integration";
import { getOnboardingData } from "./logic/onboarding";
import { globals } from "./globals";
import { getTranslation, TranslationKey } from "./translations/i18n";
import { createWinScreen } from "./components/win-screen/win-screen";

let scoreElement: HTMLElement;
let currentScore = 0;

const initializeMuted = getLocalStorageItem(LocalStorageKey.MUTED) !== "false";

function init() {
  const header = createElement({
    tag: "header",
  });

  scoreElement = createElement({
    cssClass: "score",
  });

  header.append(scoreElement);

  const btnContainer = createElement({
    cssClass: "h-btns",
  });

  const muteButton = createButton({
    text: initializeMuted ? "🔇" : "🔊",
    onClick: (event: MouseEvent) => {
      const isActive = togglePlayer();
      (event.target as HTMLElement).textContent = isActive ? "🔊" : "🔇";
    },
    iconBtn: true,
  });

  btnContainer.append(muteButton);

  header.append(btnContainer);

  btnContainer.append(createButton({ text: "⚙️", onClick: () => createWinScreen(currentScore, false), iconBtn: true }));

  document.body.append(header);

  void startNewGame();

  pubSubService.subscribe(PubSubEvent.NEW_GAME, () => {
    void startNewGame();
  });

  pubSubService.subscribe(PubSubEvent.UPDATE_SCORE, ({ score, moves, par }) => {
    let scoreText = `${getTranslation(TranslationKey.MOVES)}: ${moves}`;
    let onboardingData = getOnboardingData();
    let parValue = onboardingData?.par ?? par;

    if (onboardingData?.par || globals.metaData) {
      scoreText += ` | Par: ${parValue}`;
    }

    if (!onboardingData) {
      currentScore = score;
      scoreText += ` | ${formatNumber(score)} <span class="emoji-font">⭐️</span>`;
    }

    scoreElement.innerHTML = scoreText;
  });
}

function formatNumber(num: number): string {
  return ("" + (10000 + num)).substring(1);
}

// INIT
const initApp = async () => {
  init();
  await initAudio(initializeMuted);
};

if (process.env.POKI_ENABLED === "true") initPoki(initApp);
else initApp();
