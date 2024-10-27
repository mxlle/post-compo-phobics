export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function waitForPromiseAndTime(promise: Promise<unknown>, ms: number) {
  return Promise.all([promise, sleep(ms)]);
}

export async function requestAnimationFrameWithTimeout(ms: number): Promise<void> {
  await sleep(ms);
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export function debounce(func, timeout = 300) {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}
