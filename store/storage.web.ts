// Web storage: uses browser localStorage
// Metro automatically picks this file on web builds instead of storage.ts
const webStorage = {
  getItem: (key: string): Promise<string | null> => {
    try {
      return Promise.resolve(localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch {}
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch {}
    return Promise.resolve();
  },
};

export default webStorage;
