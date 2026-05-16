import '@testing-library/jest-dom';

class ResizeObserverMock implements ResizeObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// Mock localStorage
const localStorageMock: Storage = (function () {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: function () {
      store = {};
    },
    getItem: function (key: string) {
      return store[key] || null;
    },
    key: function (index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem: function (key: string) {
      delete store[key];
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
