/**
 * @jest-environment jsdom
 */

import { TextProperty } from '../../Utils/Properties/TextProperty';

// Mock Obsidian modules
jest.mock('obsidian', () => ({}), { virtual: true });

// Mock axios
jest.mock('axios');

// Mock App module
jest.mock('../../Utils/App', () => ({
    setIcon: jest.fn((element: HTMLElement, iconName: string) => {
        element.setAttribute('data-icon', iconName);
    }),
    default: {},
    TFile: jest.fn(),
    Notice: jest.fn()
}));

describe('TextProperty', () => {
    let textProperty: TextProperty;
    let mockVault: any;
    let mockFile: any;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        
        // Mock vault with app and files
        mockVault = {
            app: {
                vault: {
                    getFiles: jest.fn(() => [
                        { 
                            basename: 'Test File', 
                            path: 'test-file.md',
                            name: 'test-file.md'
                        },
                        { 
                            basename: 'Another File', 
                            path: 'another-file.md',
                            name: 'another-file.md'
                        }
                    ])
                },
                metadataCache: {
                    getFileCache: jest.fn(() => ({
                        frontmatter: { Classe: 'TestClass' }
                    }))
                },
                workspace: {
                    getLeaf: jest.fn(() => ({
                        openFile: jest.fn()
                    }))
                }
            },
            getFromLink: jest.fn((target: string) => ({
                file: { path: `${target}.md` }
            }))
        };

        // Mock file
        mockFile = {
            getMetadata: jest.fn(() => ({ testProp: 'test value with [[link]]' })),
            getMetadataValue: jest.fn((key: string) => key === 'testProp' ? 'test value with [[link]]' : undefined),
            updateMetadata: jest.fn(),
            vault: mockVault
        };

        textProperty = new TextProperty('testProp');
        textProperty.vault = mockVault;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create TextProperty with correct type', () => {
            const prop = new TextProperty('test');
            
            expect(prop.name).toBe('test');
            expect(prop.type).toBe('text');
        });

        it('should accept additional arguments', () => {
            const args = { icon: 'text', staticProperty: true };
            const prop = new TextProperty('test', args);
            
            expect(prop.name).toBe('test');
            expect(prop.static).toBe(true);
        });
    });

    describe('createFieldInput', () => {
        it('should create textarea element with correct properties', () => {
            const textarea = textProperty.createFieldInput('test content');
            
            expect(textarea.tagName).toBe('TEXTAREA');
            expect((textarea as HTMLTextAreaElement).value).toBe('test content');
            expect(textarea.classList.contains('field-textarea')).toBe(true);
            expect((textarea as HTMLTextAreaElement).rows).toBe(4);
            expect((textarea as HTMLTextAreaElement).style.resize).toBe('vertical');
        });

        it('should handle empty value', () => {
            const textarea = textProperty.createFieldInput('');
            
            expect((textarea as HTMLTextAreaElement).value).toBe('');
        });

        it('should setup autocomplete functionality', () => {
            const textarea = textProperty.createFieldInput('test');
            
            expect(textarea.getAttribute('data-keydown-listener')).toBe('false');
            
            // Test that input event triggers autocomplete
            const inputEvent = new Event('input');
            const autocompleteSpy = jest.spyOn(textProperty, 'handleAutocomplete').mockImplementation(() => {});
            
            textarea.dispatchEvent(inputEvent);
            
            expect(autocompleteSpy).toHaveBeenCalledWith(textarea);
        });
    });

    describe('createFieldContainer', () => {
        it('should create container with correct class', () => {
            const container = textProperty.createFieldContainer();
            
            expect(container.tagName).toBe('DIV');
            expect(container.classList.contains('metadata-textfield')).toBe(true);
        });
    });

    describe('createFieldLink', () => {
        it('should create link element with formatted content', () => {
            const content = 'Text with [[internal link|alias]] and [[another link]]';
            const link = textProperty.createFieldLink(content);
            
            expect(link.tagName).toBe('DIV');
            expect(link.classList.contains('field-textlink')).toBe(true);
            expect(link.innerHTML).toContain('<strong><a href="#">alias</a></strong>');
            expect(link.innerHTML).toContain('<strong><a href="#">another link</a></strong>');
        });

        it('should handle content without links', () => {
            const content = 'Simple text without links';
            const link = textProperty.createFieldLink(content);
            
            expect(link.innerHTML).toBe(content);
        });

        it('should handle empty content', () => {
            const link = textProperty.createFieldLink('');
            
            expect(link.innerHTML).toBe('');
        });

        it('should setup click handlers for links', () => {
            const content = 'Text with [[test-file|Test File]]';
            const link = textProperty.createFieldLink(content);
            
            // Find the anchor element
            const anchor = link.querySelector('a');
            expect(anchor).toBeTruthy();
            
            // Mock DOM event
            Object.defineProperty(anchor, 'textContent', {
                value: 'Test File',
                writable: true
            });
            
            // Click the link
            const clickEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
            
            anchor?.dispatchEvent(clickEvent);
            
            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should have correct cursor style based on static property', () => {
            textProperty.static = false;
            const link = textProperty.createFieldLink('test');
            expect(link.style.cursor).toBe('text');
            
            textProperty.static = true;
            const linkStatic = textProperty.createFieldLink('test');
            expect(linkStatic.style.cursor).toBe('default');
        });
    });

    describe('modifyField', () => {
        it('should toggle visibility between link and textarea', () => {
            // Setup DOM structure for TextProperty
            const field = document.createElement('div');
            field.classList.add('metadata-textfield');
            const link = document.createElement('div');
            link.classList.add('field-textlink');
            link.style.display = 'block';
            const textarea = document.createElement('textarea');
            textarea.classList.add('field-textarea');
            textarea.style.display = 'none';
            
            field.appendChild(link);
            field.appendChild(textarea);
            document.body.appendChild(field);
            
            const mockEvent = { target: link } as unknown as Event;
            
            textProperty.modifyField(mockEvent);
            
            expect(link.style.display).toBe('none');
            expect(textarea.style.display).toBe('block');
        });
    });

    describe('handleFieldInput', () => {
        it('should setup event listeners', () => {
            const updateFn = jest.fn();
            const textarea = document.createElement('textarea') as HTMLTextAreaElement;
            const link = document.createElement('div');
            
            const addEventListenerSpy = jest.spyOn(textarea, 'addEventListener');
            
            textProperty.handleFieldInput(updateFn, textarea, link);
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        });

        it('should handle blur event when no autocomplete dropdown exists', async () => {
            const updateFn = jest.fn();
            const textarea = document.createElement('textarea') as HTMLTextAreaElement;
            const link = document.createElement('div');
            const parent = document.createElement('div');
            parent.appendChild(textarea);
            
            textarea.value = 'test value';
            textProperty.updateField = jest.fn();
            
            textProperty.handleFieldInput(updateFn, textarea, link);
            
            // Trigger blur event
            textarea.dispatchEvent(new Event('blur'));
            
            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(textProperty.updateField).toHaveBeenCalled();
        });

        it('should not handle blur when autocomplete dropdown exists', async () => {
            const updateFn = jest.fn();
            const textarea = document.createElement('textarea') as HTMLTextAreaElement;
            const link = document.createElement('div');
            const parent = document.createElement('div');
            const dropdown = document.createElement('div');
            dropdown.classList.add('autocomplete-dropdown');
            
            parent.appendChild(textarea);
            parent.appendChild(dropdown);
            
            textProperty.updateField = jest.fn();
            
            textProperty.handleFieldInput(updateFn, textarea, link);
            
            // Trigger blur event
            textarea.dispatchEvent(new Event('blur'));
            
            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(textProperty.updateField).not.toHaveBeenCalled();
        });

        it('should handle Escape key', async () => {
            const updateFn = jest.fn();
            const textarea = document.createElement('textarea') as HTMLTextAreaElement;
            const link = document.createElement('div');
            
            textProperty.updateField = jest.fn();
            
            textProperty.handleFieldInput(updateFn, textarea, link);
            
            // Create event with mockable preventDefault
            const preventDefault = jest.fn();
            const event = { key: 'Escape', preventDefault } as any;
            
            // Trigger the keydown event handler directly
            const listeners = (textarea as any)._eventListeners?.keydown || [];
            if (listeners.length > 0) {
                await listeners[0](event);
            }
            
            expect(preventDefault).toHaveBeenCalled();
        });
    });

    describe('handleAutocomplete', () => {
        let textarea: HTMLTextAreaElement;

        beforeEach(() => {
            textarea = document.createElement('textarea');
            textarea.value = 'test fi';
            textarea.selectionStart = 7;
            textarea.selectionEnd = 7;
            
            const parent = document.createElement('div');
            parent.appendChild(textarea);
            document.body.appendChild(parent);
        });

        it('should create autocomplete dropdown with suggestions', () => {
            textProperty.handleAutocomplete(textarea);
            
            const dropdown = textarea.parentElement?.querySelector('.autocomplete-dropdown');
            expect(dropdown).toBeTruthy();
            
            const items = dropdown?.querySelectorAll('.autocomplete-item');
            expect(items?.length).toBeGreaterThan(0);
        });

        it('should not show dropdown when no query', () => {
            textarea.value = 'test ';
            textarea.selectionStart = 5;
            
            textProperty.handleAutocomplete(textarea);
            
            const dropdown = textarea.parentElement?.querySelector('.autocomplete-dropdown');
            expect(dropdown).toBeFalsy();
        });

        it('should not show dropdown when no suggestions', () => {
            // Mock no matching files
            mockVault.app.vault.getFiles.mockReturnValue([]);
            
            textProperty.handleAutocomplete(textarea);
            
            const dropdown = textarea.parentElement?.querySelector('.autocomplete-dropdown');
            expect(dropdown).toBeFalsy();
        });

        it('should handle suggestion selection via click', () => {
            const insertSpy = jest.spyOn(textProperty, 'insertSuggestion').mockImplementation(() => {});
            
            textProperty.handleAutocomplete(textarea);
            
            const dropdown = textarea.parentElement?.querySelector('.autocomplete-dropdown');
            const firstItem = dropdown?.querySelector('.autocomplete-item') as HTMLElement;
            
            firstItem?.click();
            
            expect(insertSpy).toHaveBeenCalled();
            expect(dropdown?.parentElement).toBeFalsy(); // Dropdown should be removed
        });

        it('should handle keyboard navigation', () => {
            textProperty.handleAutocomplete(textarea);
            
            const dropdown = textarea.parentElement?.querySelector('.autocomplete-dropdown');
            expect(dropdown).toBeTruthy();
            
            // Create event with mockable preventDefault
            const preventDefault = jest.fn();
            const event = { key: 'ArrowDown', preventDefault } as any;
            
            // Trigger the keydown event handler directly
            const listeners = (textarea as any)._eventListeners?.keydown || [];
            if (listeners.length > 0) {
                listeners[0](event);
            }
            
            expect(preventDefault).toHaveBeenCalled();
            
            const selectedItem = dropdown?.querySelector('.autocomplete-item.selected');
            expect(selectedItem).toBeTruthy();
        });

        it('should handle Enter key to select suggestion', () => {
            const insertSpy = jest.spyOn(textProperty, 'insertSuggestion').mockImplementation(() => {});
            
            textProperty.handleAutocomplete(textarea);
            
            // First select an item with ArrowDown
            const preventDefault1 = jest.fn();
            const arrowDownEvent = { key: 'ArrowDown', preventDefault: preventDefault1 } as any;
            const listeners = (textarea as any)._eventListeners?.keydown || [];
            if (listeners.length > 0) {
                listeners[0](arrowDownEvent);
            }
            
            // Then press Enter - use the second handler (handleEnter)
            const preventDefault2 = jest.fn();
            const enterEvent = { key: 'Enter', preventDefault: preventDefault2 } as any;
            
            if (listeners.length > 1) {
                listeners[1](enterEvent); // Call handleEnter, not handleKeyDown
            }
            
            expect(preventDefault2).toHaveBeenCalled();
            expect(insertSpy).toHaveBeenCalled();
        });

        it('should remove dropdown on Escape key', () => {
            textProperty.handleAutocomplete(textarea);
            
            const dropdown = textarea.parentElement?.querySelector('.autocomplete-dropdown');
            expect(dropdown).toBeTruthy();
            
            // Create event with mockable preventDefault
            const preventDefault = jest.fn();
            const event = { key: 'Escape', preventDefault } as any;
            
            // Trigger the keydown event handler directly (handleKeyDown is the first one)
            const listeners = (textarea as any)._eventListeners?.keydown || [];
            if (listeners.length > 0) {
                // Call the first keydown listener (handleKeyDown) for Escape
                listeners[0](event);
            }
            
            expect(dropdown?.parentElement).toBeFalsy();
        });

        it('should remove existing dropdown before creating new one', () => {
            // Create first dropdown
            textProperty.handleAutocomplete(textarea);
            const firstDropdown = textarea.parentElement?.querySelector('.autocomplete-dropdown');
            expect(firstDropdown).toBeTruthy();
            
            // Create second dropdown (should replace first)
            textProperty.handleAutocomplete(textarea);
            const dropdowns = textarea.parentElement?.querySelectorAll('.autocomplete-dropdown');
            expect(dropdowns?.length).toBe(1);
        });
    });

    describe('insertSuggestion', () => {
        it('should insert suggestion at correct position', () => {
            const textarea = document.createElement('textarea') as HTMLTextAreaElement;
            textarea.value = 'test fi more text';
            
            const setSelectionRangeSpy = jest.spyOn(textarea, 'setSelectionRange');
            const focusSpy = jest.spyOn(textarea, 'focus');
            
            textProperty.insertSuggestion(textarea, '[[Test File]]', 5, 2);
            
            expect(textarea.value).toBe('test [[Test File]] more text');
            // Position = 5 (avant) + 13 (longueur de '[[Test File]]') = 18
            expect(setSelectionRangeSpy).toHaveBeenCalledWith(18, 18);
            expect(focusSpy).toHaveBeenCalled();
        });

        it('should handle insertion at beginning', () => {
            const textarea = document.createElement('textarea') as HTMLTextAreaElement;
            textarea.value = 'fi more text';
            
            textProperty.insertSuggestion(textarea, '[[Test File]]', 0, 2);
            
            expect(textarea.value).toBe('[[Test File]] more text');
        });

        it('should handle insertion at end', () => {
            const textarea = document.createElement('textarea') as HTMLTextAreaElement;
            textarea.value = 'test fi';
            
            textProperty.insertSuggestion(textarea, '[[Test File]]', 5, 2);
            
            expect(textarea.value).toBe('test [[Test File]]');
        });
    });

    describe('integration with base Property class', () => {
        it('should inherit all base functionality', () => {
            expect(textProperty).toBeInstanceOf(textProperty.constructor);
            expect(textProperty.name).toBe('testProp');
            expect(textProperty.type).toBe('text');
        });

        it('should override createFieldInput method', () => {
            const Property = require('../../Utils/Properties/Property').Property;
            const baseProperty = new Property('base');
            const textInput = textProperty.createFieldInput('test');
            const baseInput = baseProperty.createFieldInput('test');
            
            expect(textInput.tagName).toBe('TEXTAREA');
            expect(baseInput.tagName).toBe('INPUT');
        });

        it('should work with getDisplay method', () => {
            textProperty.read = jest.fn(() => 'test content');
            
            const display = textProperty.getDisplay(mockFile);
            
            expect(display).toBeTruthy();
            expect(display.classList.contains('metadata-textfield')).toBe(true);
        });
    });
});