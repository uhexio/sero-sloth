class Storage {
  keys = {
    account: {
      current: 'account:current:',
    },

    decimal(cy: string) {
      return ['decimal', cy].join(':');
    },

    language: 'language',
  };

  /**
   * Empties the list associated with the object of all key/value pairs, if there are any.
   */
  clear(): void {
    window.localStorage.clear();
  }

  /**
   * value = storage[key]
   */
  get(key: string): any {
    var jsonStr = window.localStorage.getItem(key);
    return jsonStr ? JSON.parse(jsonStr) : null;
  }

  /**
   * Returns the name of the nth key in the list, or null if n is greater
   * than or equal to the number of key/value pairs in the object.
   */
  key(index: number): string | null {
    return window.localStorage.key(index);
  }

  delete(key: string): void {
    window.localStorage.removeItem(key);
  }

  /**
   * storage[key] = value
   */
  set(key: string, value: any): void {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * value = storage[key]
   */
  has(key: string) {
    let data = window.localStorage.getItem(key);
    return !!data;
  }

  length() {
    return window.localStorage.length;
  }
}

const storage = new Storage();

export { storage };
