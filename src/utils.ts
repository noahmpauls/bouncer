export type OptionalProperties<Type> = {
  [Property in keyof Type]?: Type[Property]
}


/**
 * Execute a function on an interval, starting with an immediate execution.
 * 
 * @param func the function to be executed
 * @param delay delay between executions
 * @returns the interval ID
 */
export function doSetInterval(func: () => void, delay: number) {
  func();
  return setInterval(func, delay);
}
