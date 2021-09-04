const handler = {
  get: <T, K extends keyof T>(object: T, key: K, proxy: any) => {
    try {
      return object[key];
    } catch (error) {
      console.error(`${key} is undefined in object`);
      return undefined;
    }
  },
  set: <T, K extends keyof T>(object: T, key: K, value: T[K], proxy: any) => {
    object[key] = value;
    return true;
  },
};

export class ExtendableProxy {
  constructor() {
    return new Proxy(this, handler) as ExtendableProxy;
  }
}
