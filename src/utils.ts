export function doSetInterval(func: () => void, delay: number) {
  func();
  return setInterval(func, delay);
}