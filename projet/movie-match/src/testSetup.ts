import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { setupIonicReact } from '@ionic/react';

setupIonicReact({ animated: false });
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false
  });
}
