// Global test setup
import 'jest-environment-jsdom';

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn()
};

// Mock HTMLElement for tests that need it
if (typeof global.HTMLElement === 'undefined') {
    (global as any).HTMLElement = class MockHTMLElement {
        constructor() {}
        classList = { 
            add: jest.fn(), 
            contains: jest.fn(() => true), 
            remove: jest.fn() 
        };
        appendChild = jest.fn();
        querySelector = jest.fn(() => null);
        textContent = '';
        innerHTML = '';
        children = [];
    };
}

// Mock document if needed
if (typeof global.document === 'undefined') {
    (global as any).document = {
        createElement: (tagName: string) => ({
            classList: { 
                add: jest.fn(), 
                contains: jest.fn(() => true), 
                remove: jest.fn() 
            },
            appendChild: jest.fn(),
            querySelector: jest.fn(() => null),
            textContent: '',
            innerHTML: '',
            children: [],
            tagName: tagName.toUpperCase()
        }),
        body: { innerHTML: '' } as any,
        querySelector: jest.fn(() => null)
    };
}

export {};