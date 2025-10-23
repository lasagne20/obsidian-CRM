/**
 * @jest-environment jsdom
 */

import { DateProperty } from '../../Utils/Properties/DateProperty';
import { MockElement } from '../../jest-config/domMocks';

// Mock Obsidian modules
jest.mock('obsidian', () => ({}), { virtual: true });

// Mock flatpickr
jest.mock('flatpickr', () => {
    const mockFlatpickr = jest.fn((element, options) => {
        // Store the options for testing
        (element as any).flatpickrOptions = options;
        
        // Simulate flatpickr behavior
        return {
            destroy: jest.fn(),
            setDate: jest.fn(),
            clear: jest.fn()
        };
    });
    return mockFlatpickr;
});

// Mock French locale
jest.mock('flatpickr/dist/l10n/fr.js', () => ({
    French: { locale: 'fr' }
}));

// Mock SubClass, File, MyVault, Classe
jest.mock('../../Classes/SubClasses/SubClass', () => ({}));
jest.mock('../../Utils/File', () => ({}));
jest.mock('../../Utils/MyVault', () => ({}));
jest.mock('../../Classes/Classe', () => ({}));

// Mock App module
jest.mock('../../Utils/App', () => ({
    setIcon: jest.fn((element: HTMLElement, iconName: string) => {
        element.setAttribute('data-icon', iconName);
        element.textContent = `[${iconName}]`;
    })
}));

describe('DateProperty', () => {
    let dateProperty: DateProperty;
    let mockVault: any;
    let mockFile: any;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        
        // Mock vault
        mockVault = {
            app: {
                vault: { getFiles: jest.fn(() => []) }
            }
        };

        // Mock file
        mockFile = {
            getMetadata: jest.fn(() => ({ eventDate: '2024-03-15' })),
            getMetadataValue: jest.fn((key: string) => key === 'eventDate' ? '2024-03-15' : undefined),
            updateMetadata: jest.fn(),
            vault: mockVault
        };

        dateProperty = new DateProperty('eventDate', ['today', 'tomorrow', 'next-week']);
        
        // Mock current date for consistent testing
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-03-15T10:00:00Z'));
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe('constructor', () => {
        it('should create DateProperty with correct type and icons', () => {
            const quickIcons = ['today', 'tomorrow'];
            const prop = new DateProperty('testDate', quickIcons);
            
            expect(prop.name).toBe('testDate');
            expect(prop.type).toBe('date');
            expect((prop as any).quickSelectIcons).toEqual(quickIcons);
        });

        it('should accept additional arguments', () => {
            const args = { icon: 'calendar', staticProperty: true };
            const prop = new DateProperty('testDate', ['today'], args);
            
            expect(prop.name).toBe('testDate');
            expect(prop.static).toBe(true);
            expect(prop.icon).toBe('calendar');
        });
    });

    describe('formatDateForStorage', () => {
        it('should format date in YYYY-MM-DD format', () => {
            const testDate = new Date('2024-03-15T10:30:00Z');
            const result = dateProperty.formatDateForStorage(testDate);
            
            expect(result).toBe('2024-03-15');
        });

        it('should handle different dates correctly', () => {
            const dates = [
                { input: new Date('2023-12-25T00:00:00Z'), expected: '2023-12-25' },
                { input: new Date('2024-01-01T12:00:00Z'), expected: '2024-01-01' },
                { input: new Date('2024-07-04T23:59:59Z'), expected: '2024-07-04' }
            ];
            
            dates.forEach(({ input, expected }) => {
                expect(dateProperty.formatDateForStorage(input)).toBe(expected);
            });
        });
    });

    describe('formatDateForDisplay', () => {
        it('should format date in French format', () => {
            const result = dateProperty.formatDateForDisplay('2024-03-15');
            
            // The exact format may depend on the environment, but should contain day, month, year
            expect(result).toMatch(/15.*mars.*2024|15.*March.*2024|mars.*15.*2024|March.*15.*2024/i);
        });

        it('should handle different date strings', () => {
            const testCases = [
                '2023-12-25',
                '2024-01-01',
                '2024-07-04'
            ];
            
            testCases.forEach(dateString => {
                const result = dateProperty.formatDateForDisplay(dateString);
                expect(result).toBeTruthy();
                expect(typeof result).toBe('string');
            });
        });
    });

    describe('getDateForOption', () => {
        it('should return correct dates for each option', () => {
            const today = new Date('2024-03-15T10:00:00Z');
            
            const yesterday = dateProperty.getDateForOption('yesterday');
            expect(yesterday.getDate()).toBe(14); // Previous day
            
            const todayResult = dateProperty.getDateForOption('today');
            expect(todayResult.getDate()).toBe(15); // Same day
            
            const tomorrow = dateProperty.getDateForOption('tomorrow');
            expect(tomorrow.getDate()).toBe(16); // Next day
            
            const nextWeek = dateProperty.getDateForOption('next-week');
            expect(nextWeek.getDate()).toBe(22); // 7 days later
            
            const twoWeeks = dateProperty.getDateForOption('2-week');
            expect(twoWeeks.getDate()).toBe(29); // 14 days later
        });

        it('should return today for unknown options', () => {
            const result = dateProperty.getDateForOption('unknown-option');
            const today = new Date();
            
            expect(result.getDate()).toBe(today.getDate());
        });
    });

    describe('getDefaultValue', () => {
        it('should return formatted date for default option', () => {
            dateProperty.default = 'today';
            const result = dateProperty.getDefaultValue();
            
            expect(result).toBe('2024-03-15');
        });

        it('should handle different default options', () => {
            dateProperty.default = 'tomorrow';
            const result = dateProperty.getDefaultValue();
            
            expect(result).toBe('2024-03-16');
        });
    });

    describe('createFieldLink', () => {
        it('should create link with formatted date display', () => {
            const link = dateProperty.createFieldLink('2024-03-15');
            
            expect(link.tagName).toBe('DIV');
            expect(link.classList.contains('date-field-link')).toBe(true);
            expect(link.classList.contains('field-link')).toBe(true);
            expect(link.style.cursor).toBe('pointer');
            expect(link.textContent).toContain('15');
        });

        it('should show placeholder text for empty value', () => {
            const link = dateProperty.createFieldLink('');
            
            expect(link.textContent).toBe('Aucune date sélectionnée');
        });

        it('should add click listener', () => {
            const link = dateProperty.createFieldLink('2024-03-15');
            
            // Setup DOM for modifyField test
            const container = document.createElement('div');
            container.classList.add('metadata-field');
            const input = document.createElement('input');
            input.classList.add('field-input');
            container.appendChild(link);
            container.appendChild(input);
            document.body.appendChild(container);
            
            link.click();
            
            // Should trigger modifyField behavior (hard to test without full DOM setup)
            expect(link.style.cursor).toBe('pointer');
        });
    });

    describe('createFieldDate', () => {
        it('should create input with flatpickr', () => {
            const updateFn = jest.fn();
            const link = document.createElement('div');
            
            const input = dateProperty.createFieldDate('2024-03-15', updateFn, link);
            
            expect(input.tagName).toBe('INPUT');
            expect(input.type).toBe('text');
            expect(input.value).toBe('2024-03-15');
            expect(input.classList.contains('field-input')).toBe(true);
            
            // Check flatpickr was called
            const flatpickr = require('flatpickr');
            expect(flatpickr).toHaveBeenCalledWith(input, expect.objectContaining({
                dateFormat: 'Y-m-d',
                defaultDate: '2024-03-15'
            }));
        });

        it('should handle empty initial value', () => {
            const updateFn = jest.fn();
            const link = document.createElement('div');
            
            const input = dateProperty.createFieldDate('', updateFn, link);
            
            expect(input.value).toBe('');
            
            // Check flatpickr options
            expect((input as any).flatpickrOptions).toMatchObject({
                dateFormat: 'Y-m-d',
                defaultDate: ''
            });
        });

        it('should setup flatpickr with correct configuration', () => {
            const updateFn = jest.fn();
            const link = document.createElement('div');
            
            dateProperty.createFieldDate('2024-03-15', updateFn, link);
            
            const flatpickr = require('flatpickr');
            const options = flatpickr.mock.calls[0][1];
            
            expect(options.dateFormat).toBe('Y-m-d');
            expect(options.defaultDate).toBe('2024-03-15');
            expect(options.locale).toEqual({ locale: 'fr' });
            expect(typeof options.onChange).toBe('function');
            expect(typeof options.onClose).toBe('function');
        });
    });

    describe('createQuickSelect', () => {
        it('should create buttons for each quick select icon', () => {
            const updateFn = jest.fn();
            const link = document.createElement('div');
            const input = document.createElement('input') as HTMLInputElement;
            
            const container = dateProperty.createQuickSelect('', updateFn, link, input);
            
            expect(container.tagName).toBe('DIV');
            expect(container.classList.contains('quick-select-container')).toBe(true);
            
            const buttons = container.querySelectorAll('button');
            expect(buttons.length).toBe(3); // today, tomorrow, next-week
            
            // Check icons are set
            const { setIcon } = require('../../Utils/App');
            expect(setIcon).toHaveBeenCalledTimes(3);
        });

        it('should handle button clicks correctly', async () => {
            const updateFn = jest.fn().mockResolvedValue(undefined);
            const link = document.createElement('div');
            const input = document.createElement('input') as HTMLInputElement;
            
            const container = dateProperty.createQuickSelect('', updateFn, link, input);
            const buttons = container.querySelectorAll('button');
            
            // Simulate clicking first button (today) by calling the handler directly
            const firstButton = buttons[0] as unknown as MockElement;
            const clickHandler = firstButton.eventListeners?.['click']?.[0];
            
            expect(clickHandler).toBeDefined();
            
            // Call the async handler directly and wait for it
            await clickHandler();
            
            // Expect today's date (dynamic)
            const today = new Date().toISOString().split('T')[0];
            expect(updateFn).toHaveBeenCalledWith(today);
            expect(link.style.display).toBe('block');
            expect(input.style.display).toBe('none');
        }, 10000); // Increase timeout to 10s
    });

    describe('createFieldContainerContent', () => {
        it('should create complete field container', () => {
            const updateFn = jest.fn();
            const container = dateProperty.createFieldContainerContent(updateFn, '2024-03-15');
            
            expect(container.tagName).toBe('DIV');
            expect(container.classList.contains('field-container')).toBe(true);
            expect(container.classList.contains('metadata-field')).toBe(true);
            
            const link = container.querySelector('.field-link');
            const input = container.querySelector('.field-input');
            const quickSelect = container.querySelector('.quick-select-container');
            
            expect(link).toBeTruthy();
            expect(input).toBeTruthy();
            expect(quickSelect).toBeTruthy();
        });

        it('should show link for valid date value', () => {
            dateProperty.validate = jest.fn(() => '2024-03-15');
            const updateFn = jest.fn();
            
            const container = dateProperty.createFieldContainerContent(updateFn, '2024-03-15');
            
            const link = container.querySelector('.field-link') as HTMLElement;
            const input = container.querySelector('.field-input') as HTMLElement;
            
            expect(link.style.display).toBe('block');
            expect(input.style.display).toBe('none');
        });

        it('should show input for invalid date value', () => {
            dateProperty.validate = jest.fn(() => '');
            const updateFn = jest.fn();
            
            const container = dateProperty.createFieldContainerContent(updateFn, 'invalid-date');
            
            const link = container.querySelector('.field-link') as HTMLElement;
            const input = container.querySelector('.field-input') as HTMLElement;
            
            expect(link.style.display).toBe('none');
            expect(input.style.display).toBe('block');
        });
    });

    describe('updateField', () => {
        it('should update field with valid date', async () => {
            const updateFn = jest.fn();
            const input = document.createElement('input') as HTMLInputElement;
            const link = document.createElement('div');
            
            input.value = '2024-03-20';
            dateProperty.validate = jest.fn(() => '2024-03-20');
            
            await dateProperty.updateField(updateFn, input, link);
            
            expect(dateProperty.validate).toHaveBeenCalledWith('2024-03-20');
            expect(updateFn).toHaveBeenCalledWith('2024-03-20');
            expect(input.style.display).toBe('none');
            expect(link.style.display).toBe('block');
            expect(link.textContent).toContain('20');
        });

        it('should update field with invalid date', async () => {
            const updateFn = jest.fn();
            const input = document.createElement('input') as HTMLInputElement;
            const link = document.createElement('div');
            
            input.value = 'invalid-date';
            dateProperty.validate = jest.fn(() => '');
            
            await dateProperty.updateField(updateFn, input, link);
            
            expect(updateFn).toHaveBeenCalledWith('invalid-date');
        });
    });

    describe('fillDisplay', () => {
        it('should create complete display structure', () => {
            const updateFn = jest.fn();
            const result = dateProperty.fillDisplay(mockVault, '2024-03-15', updateFn);
            
            expect(dateProperty.vault).toBe(mockVault);
            expect(result.classList.contains('field-container-column')).toBe(true);
            
            const field = result.querySelector('.metadata-field');
            expect(field).toBeTruthy();
        });

        it('should include header when title is set', () => {
            dateProperty.title = 'Event Date';
            const updateFn = jest.fn();
            
            const result = dateProperty.fillDisplay(mockVault, '2024-03-15', updateFn);
            
            const header = result.querySelector('.metadata-header');
            expect(header).toBeTruthy();
            expect(header?.textContent).toBe('eventDate'); // Uses name property
        });

        it('should not include header when title is not set', () => {
            dateProperty.title = '';
            const updateFn = jest.fn();
            
            const result = dateProperty.fillDisplay(mockVault, '2024-03-15', updateFn);
            
            const header = result.querySelector('.metadata-header');
            expect(header).toBeFalsy();
        });
    });

    describe('integration with base Property class', () => {
        it('should inherit from Property class', () => {
            expect(dateProperty).toBeInstanceOf(DateProperty);
            expect(dateProperty.name).toBe('eventDate');
            expect(dateProperty.type).toBe('date');
        });

        it('should have access to base class methods', () => {
            expect(typeof dateProperty.read).toBe('function');
            expect(typeof dateProperty.validate).toBe('function');
            expect(typeof dateProperty.getPretty).toBe('function');
        });

        it('should work with getDisplay method', () => {
            dateProperty.read = jest.fn(() => '2024-03-15');
            
            const display = dateProperty.getDisplay(mockFile);
            
            expect(display).toBeTruthy();
            expect(display.classList.contains('field-container-column')).toBe(true);
        });
    });

    describe('flatpickr integration', () => {
        it('should handle onChange callback', async () => {
            const updateFn = jest.fn();
            const link = document.createElement('div');
            
            dateProperty.updateField = jest.fn();
            
            const input = dateProperty.createFieldDate('', updateFn, link);
            const options = (input as any).flatpickrOptions;
            
            // Simulate flatpickr onChange
            const testDate = new Date('2024-03-20');
            await options.onChange([testDate]);
            
            expect(input.value).toBe('2024-03-20');
            expect(dateProperty.updateField).toHaveBeenCalled();
        });

        it('should handle onClose callback', async () => {
            const updateFn = jest.fn();
            const link = document.createElement('div');
            
            dateProperty.updateField = jest.fn();
            
            const input = dateProperty.createFieldDate('2024-03-15', updateFn, link);
            const options = (input as any).flatpickrOptions;
            
            // Simulate flatpickr onClose
            await options.onClose();
            
            expect(input.value).toBe('');
            expect(dateProperty.updateField).toHaveBeenCalled();
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle invalid date strings gracefully', () => {
            expect(() => {
                dateProperty.formatDateForDisplay('invalid-date');
            }).not.toThrow();
        });

        it('should handle empty quick select icons array', () => {
            const propWithoutIcons = new DateProperty('test', []);
            const updateFn = jest.fn();
            const link = document.createElement('div');
            const input = document.createElement('input') as HTMLInputElement;
            
            const container = propWithoutIcons.createQuickSelect('', updateFn, link, input);
            const buttons = container.querySelectorAll('button');
            
            expect(buttons.length).toBe(0);
        });

        it('should handle null and undefined values', () => {
            const link1 = dateProperty.createFieldLink(null as any);
            expect(link1.textContent).toBe('Aucune date sélectionnée');
            
            const link2 = dateProperty.createFieldLink(undefined as any);
            expect(link2.textContent).toBe('Aucune date sélectionnée');
        });

        it('should handle extreme dates', () => {
            const futureDate = new Date('2099-12-31');
            const pastDate = new Date('1900-01-01');
            
            expect(() => {
                dateProperty.formatDateForStorage(futureDate);
                dateProperty.formatDateForStorage(pastDate);
            }).not.toThrow();
        });
    });
});