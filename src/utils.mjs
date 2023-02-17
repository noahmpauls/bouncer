export async function getStorage(key, defaultValue = {}) {
  const getArg = ({ [key]: defaultValue });
  console.log("wow");
  return await browser.storage.local.get(getArg)
    .then(data => data[key]);
}

export async function setStorage(key, value) {
  await browser.storage.local.set({ [key]: value });
}

export async function updateStorage(key, updater, defaultValue = {}) {
  const prevValue = await getStorage(key, defaultValue);
  const nextValue = updater(prevValue);
  await setStorage(key, nextValue);
}

export async function deleteStorage(key) {
  await browser.storage.local.remove(key);
}

export function doSetInterval(func, delay) {
  func();
  return setInterval(func, delay);
}