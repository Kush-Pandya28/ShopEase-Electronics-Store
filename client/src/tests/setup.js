import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia / IntersectionObserver
if (!window.matchMedia) {
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
}
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  };
}
