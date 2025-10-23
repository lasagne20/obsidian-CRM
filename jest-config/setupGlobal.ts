// Global test setup
import 'jest-environment-jsdom';
import { setupAdvancedDOM } from './domMocks';

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn()
};

// Mock DOM methods that jsdom doesn't support
Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: jest.fn(),
    writable: true
});

// Enhanced Element mock with better querySelector
Object.defineProperty(Element.prototype, 'querySelector', {
    value: jest.fn(function(selector: string) {
        // Create a mock element for common selectors
        const mockElement = {
            tagName: selector.includes('button') ? 'BUTTON' : 
                    selector.includes('input') ? 'INPUT' : 
                    selector.includes('select') ? 'SELECT' : 
                    selector.includes('span') ? 'SPAN' : 'DIV',
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn(() => false),
                toggle: jest.fn()
            },
            style: {},
            textContent: '',
            innerHTML: '',
            value: '',
            addEventListener: jest.fn(),
            click: jest.fn(),
            focus: jest.fn(),
            blur: jest.fn(),
            setAttribute: jest.fn(),
            getAttribute: jest.fn(() => null),
            scrollIntoView: jest.fn(),
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            parentElement: null,
            querySelectorAll: jest.fn(() => []),
            querySelector: jest.fn(() => null)
        };
        return mockElement;
    }),
    writable: true
});

Object.defineProperty(Element.prototype, 'querySelectorAll', {
    value: jest.fn(function(selector: string) {
        // Return array of mock elements
        return Array.from({ length: 3 }, () => ({
            tagName: 'BUTTON',
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn(() => false)
            },
            click: jest.fn(),
            style: {},
            textContent: '',
            setAttribute: jest.fn(),
            getAttribute: jest.fn(() => null)
        }));
    }),
    writable: true
});

// Mock HTMLElement for tests that need it
if (typeof global.HTMLElement === 'undefined') {
    (global as any).HTMLElement = class MockHTMLElement {
        constructor() {}
        classList = { 
            add: jest.fn(), 
            contains: jest.fn(() => true), 
            remove: jest.fn(),
            toggle: jest.fn()
        };
        appendChild = jest.fn();
        querySelector = jest.fn(() => ({
            tagName: 'DIV',
            classList: { add: jest.fn(), contains: jest.fn(() => false), remove: jest.fn() },
            style: {},
            click: jest.fn()
        }));
        scrollIntoView = jest.fn();
        textContent = '';
        innerHTML = '';
        children = [];
        style = {};
    };
}

// Enhanced document mock
if (typeof global.document === 'undefined') {
    (global as any).document = {
        createElement: (tagName: string) => {
            const element = {
                tagName: tagName.toUpperCase(),
                classList: { 
                    add: jest.fn(), 
                    contains: jest.fn(() => false), 
                    remove: jest.fn(),
                    toggle: jest.fn()
                },
                appendChild: jest.fn(function(child: any) {
                    if (this.children) {
                        this.children.push(child);
                    }
                    return child;
                }),
                removeChild: jest.fn(),
                querySelector: jest.fn(() => null),
                querySelectorAll: jest.fn(() => []),
                scrollIntoView: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                click: jest.fn(),
                focus: jest.fn(),
                blur: jest.fn(),
                dispatchEvent: jest.fn(),
                setAttribute: jest.fn(),
                getAttribute: jest.fn(() => null),
                setSelectionRange: jest.fn(),
                textContent: '',
                innerHTML: '',
                innerText: '',
                value: '',
                type: tagName.toLowerCase() === 'input' ? 'text' : undefined,
                children: [],
                style: {},
                parentElement: null,
                dataset: {}
            };
            return element;
        },
        body: { 
            innerHTML: '',
            appendChild: jest.fn(),
            querySelector: jest.fn(() => null)
        } as any,
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => [])
    };
}

// Additional jsdom polyfills
beforeEach(() => {
    // Setup enhanced DOM mocks
    setupAdvancedDOM();
    
    // Mock scrollIntoView for all elements created during tests
    jest.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    
    // Mock appendChild to handle non-Node parameters
    const originalAppendChild = Element.prototype.appendChild;
    jest.spyOn(Element.prototype, 'appendChild').mockImplementation((child: any) => {
        if (child && typeof child === 'object') {
            return child;
        }
        return originalAppendChild.call(this, child);
    });
});

export { };
