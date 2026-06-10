import '@testing-library/jest-dom';

// jsdom não implementa `window.matchMedia`, mas o Ant Design depende dele
// (grid responsivo, breakpoints). Sem este polyfill, qualquer teste que monte
// componentes antd (Table, Layout, Modal, etc.) falha com
// "window.matchMedia is not a function".
// jsdom também não implementa `ResizeObserver`, usado pelos popups/dropdowns
// do Ant Design (Select, Tooltip, etc.) para reposicionamento.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.ResizeObserver = ResizeObserverStub as typeof ResizeObserver;
  globalThis.ResizeObserver = ResizeObserverStub as typeof ResizeObserver;
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
