// Mock global objects
Object.defineProperty(window, 'HTMLElement', {
  value: global.HTMLElement,
});

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};