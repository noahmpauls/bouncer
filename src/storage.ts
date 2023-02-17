import browser from "webextension-polyfill";

export async function getStorage(key: string, defaultValue: any = {}): Promise<any> {
  const getArg = ({ [key]: defaultValue });
  return await browser.storage.local.get(getArg)
    .then(data => data[key]);
}

export async function setStorage(key: string, value: any) {
  await browser.storage.local.set({ [key]: value });
}

export async function updateStorage(key: string, updater: (x: any) => any, defaultValue: any = {}) {
  const prevValue = await getStorage(key, defaultValue);
  const nextValue = updater(prevValue);
  await setStorage(key, nextValue);
}

export async function deleteStorage(key: string) {
  await browser.storage.local.remove(key);
}
