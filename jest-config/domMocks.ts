// Enhanced DOM mocks for better test compatibility
export class MockElement {
    tagName: string;
    classList: any;
    style: any;
    textContent: string;
    innerHTML: string;
    _innerHTML: string;
    value: string;
    type?: string;
    children: any[];
    parentElement: any;
    dataset: any;
    tabIndex: number;
    disabled?: boolean;
    rows?: number;
    selectionStart?: number;
    selectionEnd?: number;
    _cssClasses: Set<string> = new Set();

    constructor(tagName: string) {
        this.tagName = tagName.toUpperCase();
        
        // Enhanced classList with real behavior
        this.classList = {
            add: jest.fn((...classNames: string[]) => {
                classNames.forEach(className => this._cssClasses.add(className));
            }),
            remove: jest.fn((...classNames: string[]) => {
                classNames.forEach(className => this._cssClasses.delete(className));
            }),
            contains: jest.fn((className: string) => {
                return this._cssClasses.has(className);
            }),
            toggle: jest.fn((className: string) => {
                if (this._cssClasses.has(className)) {
                    this._cssClasses.delete(className);
                    return false;
                } else {
                    this._cssClasses.add(className);
                    return true;
                }
            })
        };
        
        // Enhanced style with persistent values and proper defaults
        const styleObj: any = {
            display: 'block', // Default display value should be block for most elements
            backgroundColor: '',
            resize: ''
        };
        this.style = new Proxy(styleObj, {
            get: (target: any, prop) => {
                return target[prop] !== undefined ? target[prop] : '';
            },
            set: (target: any, prop, value) => {
                target[prop] = value;
                return true;
            }
        });
        
        this.textContent = '';
        this._innerHTML = '';
        this.value = '';
        this.children = [];
        this.parentElement = null;
        this.dataset = {};
        
        // innerHTML with basic HTML parsing for anchor tags
        Object.defineProperty(this, 'innerHTML', {
            get: () => this._innerHTML,
            set: (html: string) => {
                this._innerHTML = html;
                this.children = [];
                
                // Simple parser for anchor tags and other common elements
                if (html) {
                    // Parse <a href="#">text</a> tags
                    const anchorRegex = /<a[^>]*href=[^>]*>(.*?)<\/a>/g;
                    let match;
                    while ((match = anchorRegex.exec(html)) !== null) {
                        const anchor = new MockElement('a');
                        anchor.textContent = match[1];
                        anchor.setAttribute('href', '#');
                        this.children.push(anchor);
                        anchor.parentElement = this;
                    }
                    
                    // Parse other simple tags if needed
                    const tagRegex = /<(\w+)[^>]*>(.*?)<\/\1>/g;
                    let tagMatch;
                    while ((tagMatch = tagRegex.exec(html)) !== null) {
                        const tagName = tagMatch[1];
                        const content = tagMatch[2];
                        
                        // Skip anchor tags (already processed) and nested tags
                        if (tagName !== 'a' && !content.includes('<')) {
                            const element = new MockElement(tagName);
                            element.textContent = content;
                            this.children.push(element);
                            element.parentElement = this;
                        }
                    }
                }
            }
        });
        
        if (tagName.toLowerCase() === 'input') {
            this.type = 'text';
            // Input elements should be initially visible
            this.style.display = 'block';
        }
        
        if (tagName.toLowerCase() === 'textarea') {
            this.rows = 4;
            this.style.resize = 'vertical';
            this.selectionStart = 0;
            this.selectionEnd = 0;
        }
        
        // Add tabIndex and disabled property for interactive elements
        if (['input', 'button', 'select', 'textarea', 'a'].includes(tagName.toLowerCase())) {
            this.tabIndex = 0;
            this.disabled = false;
        }
    }

    appendChild = jest.fn((child: any) => {
        this.children.push(child);
        child.parentElement = this;
        return child;
    });

    removeChild = jest.fn((child: any) => {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parentElement = null;
        }
        return child;
    });

    querySelector: jest.MockedFunction<(selector: string) => MockElement | null> = jest.fn((selector: string): MockElement | null => {
        // First check children for actual elements
        for (const child of this.children) {
            if (child && child.tagName) {
                // Check by tag name
                if (selector.toLowerCase() === child.tagName.toLowerCase()) {
                    return child;
                }
                // Check by class selector (supports multiple classes like .class1.class2)
                if (selector.startsWith('.') && child.classList) {
                    const classNames = selector.substring(1).split('.');
                    const hasAllClasses = classNames.every(className => 
                        className && child.classList.contains(className)
                    );
                    if (hasAllClasses) {
                        return child;
                    }
                }
                // Check by attribute selector [attr] or [attr="value"]
                if (selector.startsWith('[') && selector.endsWith(']')) {
                    const attrMatch = selector.slice(1, -1); // Remove [ and ]
                    const equalIndex = attrMatch.indexOf('=');
                    
                    if (equalIndex === -1) {
                        // Simple attribute selector [attr]
                        if (child.hasAttribute && child.hasAttribute(attrMatch)) {
                            return child;
                        }
                    } else {
                        // Attribute with value selector [attr="value"]
                        const attrName = attrMatch.substring(0, equalIndex);
                        const attrValue = attrMatch.substring(equalIndex + 1).replace(/['"]/g, ''); // Remove quotes
                        if (child.getAttribute && child.getAttribute(attrName) === attrValue) {
                            return child;
                        }
                    }
                }
                // Recursive search in children
                if (child.querySelector) {
                    const found = child.querySelector(selector);
                    if (found) return found;
                }
            }
        }
        
        // Only return fallback elements for specific cases where tests expect them
        if (selector === 'span' || selector === 'button' || selector === 'input' || selector === 'select') {
            if (selector === 'select') {
                return new MockSelectElement();
            }
            return new MockElement(selector);
        }
        
        // Return null for class selectors that don't match anything in children
        return null;
    });

    querySelectorAll = jest.fn((selector: string) => {
        // For option selector on select elements, return actual options
        if (selector === 'option' && this.tagName === 'SELECT' && (this as any).options) {
            return (this as any).options;
        }
        
        // For other cases, search through children
        const matches: MockElement[] = [];
        const searchChildren = (elements: MockElement[]) => {
            for (const child of elements) {
                // Check by tag name
                if (selector.toLowerCase() === child.tagName.toLowerCase()) {
                    matches.push(child);
                }
                // Check by class selector
                if (selector.startsWith('.') && child.classList && child.classList.contains(selector.substring(1))) {
                    matches.push(child);
                }
                // Recursively search children
                if (child.children && child.children.length > 0) {
                    searchChildren(child.children);
                }
            }
        };
        
        if (this.children && this.children.length > 0) {
            searchChildren(this.children);
        }
        
        return matches;
    });

    private _eventListeners: Record<string, Function[]> = {};
    
    addEventListener = jest.fn((event: string, handler: Function) => {
        if (!this._eventListeners[event]) {
            this._eventListeners[event] = [];
        }
        this._eventListeners[event].push(handler);
    });
    
    removeEventListener = jest.fn((event: string, handler: Function) => {
        if (this._eventListeners[event]) {
            const index = this._eventListeners[event].indexOf(handler);
            if (index > -1) {
                this._eventListeners[event].splice(index, 1);
            }
        }
    });
    
    dispatchEvent = jest.fn((event: any) => {
        const eventType = event.type || event;
        if (this._eventListeners[eventType]) {
            this._eventListeners[eventType].forEach(handler => {
                try {
                    handler.call(this, event);
                } catch (e) {
                    console.error('Event handler error:', e);
                }
            });
            return true;
        }
        return false;
    });
    
    click = jest.fn(() => {
        const clickEvent = {
            type: 'click',
            target: this,
            currentTarget: this,
            preventDefault: jest.fn(),
            stopPropagation: jest.fn(),
            bubbles: true,
            cancelable: true
        };
        this.dispatchEvent(clickEvent);
    });
    
    focus = jest.fn(() => {
        const focusEvent = {
            type: 'focus',
            target: this,
            currentTarget: this
        };
        this.dispatchEvent(focusEvent);
    });
    
    blur = jest.fn(() => {
        const blurEvent = {
            type: 'blur',
            target: this,
            currentTarget: this
        };
        this.dispatchEvent(blurEvent);
    });
    scrollIntoView = jest.fn();
    
    getBoundingClientRect = jest.fn(() => ({
        top: 0,
        left: 0,
        bottom: 100,
        right: 200,
        width: 200,
        height: 100,
        x: 0,
        y: 0
    }));
    
    // Enhanced attribute management
    _attributes: Record<string, string> = {};
    
    setAttribute = jest.fn((name: string, value: string) => {
        this._attributes[name] = value;
    });
    
    getAttribute = jest.fn((name: string) => {
        return this._attributes[name] || null;
    });
    
    hasAttribute = jest.fn((name: string) => {
        return name in this._attributes;
    });
    
    removeAttribute = jest.fn((name: string) => {
        delete this._attributes[name];
    });
    
    // Remove element from DOM
    remove = jest.fn(() => {
        if (this.parentElement) {
            this.parentElement.removeChild(this);
        }
    });
    
    // Closest method for event delegation
    closest = jest.fn((selector: string): MockElement | null => {
        // Simple implementation - check if current element matches
        if (selector.startsWith('.')) {
            // Class selector
            const className = selector.substring(1);
            if (this.classList.contains(className)) {
                return this;
            }
        } else if (selector.includes('[') && selector.includes(']')) {
            // Attribute selector
            const attrMatch = selector.match(/\[([^=\]]+)(?:=(['"])([^'"]*)\2)?\]/);
            if (attrMatch) {
                const [, attrName, , attrValue] = attrMatch;
                if (attrValue !== undefined) {
                    if (this.getAttribute(attrName) === attrValue) {
                        return this;
                    }
                } else {
                    if (this.hasAttribute(attrName)) {
                        return this;
                    }
                }
            }
        } else {
            // Tag selector
            if (this.tagName.toLowerCase() === selector.toLowerCase()) {
                return this;
            }
        }
        
        // Check parent
        if (this.parentElement) {
            return this.parentElement.closest(selector);
        }
        return null;
    });
    
    setSelectionRange = jest.fn();
    
    // href property for anchor elements
    private _href: string = '';
    
    get href(): string {
        return this._href;
    }
    
    set href(value: string) {
        this._href = value;
        // Normalize URLs like browsers do - add trailing slash for domain-only URLs
        if (value && value.match(/^https?:\/\/[^\/]+$/)) {
            this._href = value + '/';
        }
    }
    
    // Getter for event listeners for testing purposes
    get eventListeners(): Record<string, Function[]> {
        return this._eventListeners;
    }
}

// Mock for HTMLInputElement specific properties
export class MockInputElement extends MockElement {
    constructor() {
        super('input');
        this.type = 'text';
        this.value = '';
    }
}

// Mock for HTMLSelectElement
export class MockSelectElement extends MockElement {
    selectedIndex: number = 0;
    options: MockElement[] = [];
    private _selectValue: string = '';
    
    constructor() {
        super('select');
        
        // Override value property behavior for select
        this.selectedIndex = -1; // Start with no selection
        this._selectValue = '';
        
        // Override the inherited value property
        Object.defineProperty(this, 'value', {
            get: () => {
                if (this.selectedIndex >= 0 && this.selectedIndex < this.options.length) {
                    return this.options[this.selectedIndex].value || '';
                }
                return this._selectValue;
            },
            set: (newValue: string) => {
                const oldValue = this._selectValue;
                const index = this.options.findIndex(option => option.value === newValue);
                
                // Update selected state of all options
                this.options.forEach((option, i) => {
                    (option as any)._selected = (i === index);
                });
                
                if (index >= 0) {
                    this.selectedIndex = index;
                } else {
                    this.selectedIndex = -1;
                }
                this._selectValue = newValue;
                
                // Trigger change event if value actually changed
                if (oldValue !== newValue) {
                    const changeEvent = {
                        type: 'change',
                        target: this,
                        currentTarget: this,
                        bubbles: true,
                        cancelable: true
                    };
                    // Use setTimeout to make it async like real DOM
                    setTimeout(() => this.dispatchEvent(changeEvent), 0);
                }
            },
            enumerable: true,
            configurable: true
        });
    }

    appendChild = jest.fn((child: MockElement) => {
        // Call the original implementation to add to children array
        this.children.push(child);
        child.parentElement = this;
        
        // If adding an option element, also add it to the options array
        if (child.tagName === 'OPTION') {
            this.options.push(child);
            
            // Update selected state
            if ((child as any)._selected === true) {
                // Update selected state of all options
                this.options.forEach((option, i) => {
                    (option as any)._selected = (option === child);
                });
                this.selectedIndex = this.options.length - 1;
            } else {
                (child as any)._selected = false;
                // If this is the first option and nothing is selected, select it by default
                if (this.options.length === 1 && this.selectedIndex === -1) {
                    this.selectedIndex = 0;
                    (child as any)._selected = true;
                }
            }
        }
        
        return child;
    });

    add(option: MockElement) {
        this.appendChild(option);
    }

    removeOption(index: number) {
        if (index >= 0 && index < this.options.length) {
            const removed = this.options.splice(index, 1)[0];
            this.removeChild(removed);
            
            // Adjust selected index if necessary
            if (this.selectedIndex >= this.options.length) {
                this.selectedIndex = this.options.length - 1;
            }
        }
    }
}

export const setupAdvancedDOM = () => {
    // Store original functions for cleanup
    const originals = {
        createElement: document.createElement,
        querySelector: document.querySelector,
        querySelectorAll: document.querySelectorAll
    };
    
    // Override document.createElement to return our enhanced mocks
    document.createElement = jest.fn((tagName: string) => {
        switch (tagName.toLowerCase()) {
            case 'input':
                return new MockInputElement() as any;
            case 'select':
                return new MockSelectElement() as any;
            case 'option':
                const option = new MockElement('option');
                option.value = '';
                option.textContent = '';
                // Add selected property for option elements
                Object.defineProperty(option, 'selected', {
                    get() { return this._selected || false; },
                    set(value) { this._selected = !!value; },
                    enumerable: true,
                    configurable: true
                });
                (option as any)._selected = false;
                return option as any;
            case 'button':
            case 'div':
            case 'span':
            case 'p':
            case 'h1':
            case 'h2':
            case 'h3':
            case 'li':
            case 'ul':
                return new MockElement(tagName) as any;
            default:
                return new MockElement(tagName) as any;
        }
    });

    // Enhanced document query methods that can return null
    const mockQuerySelector = jest.fn((selector: string): any => {
        // Return null for specific selectors that tests expect to be null
        if (selector.includes('.metadata-title') && selector.includes('undefined')) {
            return null;
        }
        if (selector.includes('.metadata-header') && selector.includes('undefined')) {
            return null;
        }
        
        // For document-level queries, create appropriate elements
        const rootElement = new MockElement('div');
        const result = rootElement.querySelector(selector);
        return result;
    });

    const mockQuerySelectorAll = jest.fn((selector: string): any => {
        // Return empty array for some selectors
        if (selector.includes('undefined') || selector.includes('null')) {
            return [];
        }
        return Array.from({ length: 3 }, () => new MockElement('div'));
    });

    document.querySelector = mockQuerySelector;
    document.querySelectorAll = mockQuerySelectorAll;
    document.body.querySelector = mockQuerySelector;
    document.body.querySelectorAll = mockQuerySelectorAll;
    
    // Override document.body methods to work with our mocks
    const originalBodyAppendChild = document.body.appendChild;
    const originalBodyRemoveChild = document.body.removeChild;
    
    document.body.appendChild = jest.fn((child: any) => {
        // If it's our MockElement, just return it
        if (child && typeof child === 'object' && child.tagName) {
            return child;
        }
        // Otherwise, use the original method
        try {
            return originalBodyAppendChild.call(document.body, child);
        } catch (e) {
            return child; // Fallback
        }
    });
    
    document.body.removeChild = jest.fn((child: any) => {
        // If it's our MockElement, just return it
        if (child && typeof child === 'object' && child.tagName) {
            return child;
        }
        // Otherwise, use the original method  
        try {
            return originalBodyRemoveChild.call(document.body, child);
        } catch (e) {
            return child; // Fallback
        }
    });

    // Enhanced event mocking with better KeyboardEvent support
    const createMockEvent = (type: string = 'click', target?: MockElement, options?: any) => ({
        target: target || new MockElement('div'),
        currentTarget: target || new MockElement('div'),
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        stopImmediatePropagation: jest.fn(),
        type,
        bubbles: true,
        cancelable: true,
        detail: 0,
        clientX: 0,
        clientY: 0,
        key: options?.key || '',
        code: options?.code || '',
        keyCode: options?.keyCode || 0,
        which: options?.which || 0
    });

    (global as any).Event = jest.fn().mockImplementation((type: string) => createMockEvent(type));
    (global as any).MouseEvent = jest.fn().mockImplementation((type: string) => createMockEvent(type));
    (global as any).KeyboardEvent = jest.fn().mockImplementation((type: string) => createMockEvent(type));

    // Mock window methods that are used in tests
    Object.defineProperty(window, 'getComputedStyle', {
        value: jest.fn(() => ({
            font: '14px Arial',
            fontSize: '14px',
            fontFamily: 'Arial'
        })),
        writable: true
    });

    Object.defineProperty(window, 'scrollY', {
        value: 0,
        writable: true
    });

    Object.defineProperty(window, 'scrollX', {
        value: 0,
        writable: true
    });

    // Return cleanup function
    return () => {
        document.createElement = originals.createElement;
        document.querySelector = originals.querySelector;
        document.querySelectorAll = originals.querySelectorAll;
    };
};