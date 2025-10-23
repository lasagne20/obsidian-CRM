/**
 * @jest-environment jsdom
 */

import { File } from '../../Utils/File';
import { MyVault } from '../../Utils/MyVault';
import { FileProperty } from '../../Utils/Properties/FileProperty';
import { MultiFileProperty } from '../../Utils/Properties/MultiFileProperty';

// Mock using the exact path used in the source file
jest.mock('Utils/Modals/Modals', () => ({
    selectMultipleFile: jest.fn()
}));

jest.mock('../../Utils/App', () => ({
    setIcon: jest.fn()
}));

// Mocks
jest.mock('../../Utils/Properties/FileProperty');
jest.mock('../../Utils/File');
jest.mock('../../Utils/MyVault');

// Import the mocked function  
const { selectMultipleFile } = jest.requireMock('Utils/Modals/Modals');
const { setIcon } = jest.requireMock('../../Utils/App');

describe('MultiFileProperty', () => {
    let multiFileProperty: MultiFileProperty;
    let mockVault: jest.Mocked<MyVault>;
    let mockFileProperty: jest.Mocked<FileProperty>;
    let mockFile: jest.Mocked<File>;
    let mockUpdate: jest.Mock;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mocks
        mockVault = {
            readFile: jest.fn(),
            getFiles: jest.fn()
        } as any;

        mockFile = {
            getLink: jest.fn().mockReturnValue('[[TestFile]]'),
            path: 'TestFile.md'
        } as any;

        mockFileProperty = {
            fillDisplay: jest.fn().mockReturnValue(document.createElement('div')),
            getParentValue: jest.fn(),
            name: 'testFile'
        } as any;

        mockUpdate = jest.fn();

        // Mock FileProperty constructor
        (FileProperty as jest.MockedClass<typeof FileProperty>).mockImplementation(() => mockFileProperty);

        // Reset selectMultipleFile to return empty array by default
        selectMultipleFile.mockResolvedValue([]);
    });

    describe('Constructor', () => {
        test('should create MultiFileProperty with required parameters', () => {
            const classes = ['Document', 'Image'];
            multiFileProperty = new MultiFileProperty('testFiles', classes);

            expect(multiFileProperty.name).toBe('testFiles');
            expect(multiFileProperty.type).toBe('multiFile');
            expect(multiFileProperty.classes).toEqual(classes);
            expect(multiFileProperty.flexSpan).toBe(2);
            expect(multiFileProperty.property).toBe(mockFileProperty);
        });

        test('should create FileProperty instance in constructor', () => {
            const classes = ['Document'];
            const args = { icon: 'file' };
            
            multiFileProperty = new MultiFileProperty('testFiles', classes, args);

            expect(FileProperty).toHaveBeenCalledWith('testFiles', classes, args);
        });

        test('should handle empty classes array', () => {
            multiFileProperty = new MultiFileProperty('testFiles', []);

            expect(multiFileProperty.classes).toEqual([]);
            expect(multiFileProperty.getClasses()).toEqual([]);
        });
    });

    describe('getClasses', () => {
        test('should return classes array', () => {
            const classes = ['Document', 'Image', 'Video'];
            multiFileProperty = new MultiFileProperty('testFiles', classes);

            expect(multiFileProperty.getClasses()).toEqual(classes);
        });
    });

    describe('getParentValue', () => {
        test('should delegate to FileProperty getParentValue', () => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);
            const testValues = { test: 'value' };
            const expectedResult = mockFile;

            mockFileProperty.getParentValue.mockReturnValue(expectedResult);

            const result = multiFileProperty.getParentValue(testValues);

            expect(mockFileProperty.getParentValue).toHaveBeenCalledWith(testValues);
            expect(result).toBe(expectedResult);
        });

        test('should return undefined when FileProperty returns undefined', () => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);
            const testValues = { test: 'value' };

            mockFileProperty.getParentValue.mockReturnValue(undefined);

            const result = multiFileProperty.getParentValue(testValues);

            expect(result).toBeUndefined();
        });
    });

    describe('formatParentValue', () => {
        test('should wrap single value in array', () => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);

            const result = multiFileProperty.formatParentValue('test-value');
            
            expect(result).toEqual(['test-value']);
        });

        test('should handle empty string', () => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);

            const result = multiFileProperty.formatParentValue('');
            
            expect(result).toEqual(['']);
        });
    });

    describe('fillDisplay', () => {
        beforeEach(() => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);
        });

        test('should create container with correct classes', () => {
            const values: any[] = [];
            
            const container = multiFileProperty.fillDisplay(mockVault, values, mockUpdate);

            expect(container.classList.add).toHaveBeenCalledWith('metadata-multiFiles-container-testfiles');
            expect(container.classList.add).toHaveBeenCalledWith('metadata-multiFiles-container');
        });

        test('should set vault property', () => {
            const values: any[] = [];
            
            multiFileProperty.fillDisplay(mockVault, values, mockUpdate);

            expect(multiFileProperty.vault).toBe(mockVault);
        });

        test('should create add button', () => {
            const values: any[] = [];
            
            const container = multiFileProperty.fillDisplay(mockVault, values, mockUpdate);

            expect(container.appendChild).toHaveBeenCalled();
        });

        test('should handle null values', () => {
            const container = multiFileProperty.fillDisplay(mockVault, null, mockUpdate);

            expect(container).toBeDefined();
            expect(container.classList.add).toHaveBeenCalled();
        });
    });

    describe('createObjects', () => {
        beforeEach(() => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);
        });

        test('should handle null values', () => {
            const container = document.createElement('div');
            
            // Should not throw
            multiFileProperty.createObjects(null, mockUpdate, container);
            multiFileProperty.createObjects(undefined, mockUpdate, container);
            
            expect(container.appendChild).not.toHaveBeenCalled();
        });

        test('should create rows for each value', () => {
            const container = document.createElement('div');
            const values = ['[[File1]]', '[[File2]]', '[[File3]]'];
            
            multiFileProperty.createObjects(values, mockUpdate, container);

            expect(container.appendChild).toHaveBeenCalledTimes(3);
        });

        test('should handle empty array', () => {
            const container = document.createElement('div');
            const values: any[] = [];
            
            multiFileProperty.createObjects(values, mockUpdate, container);

            expect(container.appendChild).not.toHaveBeenCalled();
        });
    });

    describe('createObjectRow', () => {
        beforeEach(() => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);
            multiFileProperty.vault = mockVault;
        });

        test('should create row with correct class', () => {
            const container = document.createElement('div');
            const values = ['[[File1]]'];
            
            const row = multiFileProperty.createObjectRow(values, mockUpdate, '[[File1]]', 0, container);

            expect(row.classList.add).toHaveBeenCalledWith('metadata-multiFiles-row-inline');
        });

        test('should create delete button', () => {
            const container = document.createElement('div');
            const values = ['[[File1]]'];
            
            const row = multiFileProperty.createObjectRow(values, mockUpdate, '[[File1]]', 0, container);

            expect(row.appendChild).toHaveBeenCalledTimes(2); // delete button + property container
        });

        test('should create property container', () => {
            const container = document.createElement('div');
            const values = ['[[File1]]'];
            
            const row = multiFileProperty.createObjectRow(values, mockUpdate, '[[File1]]', 0, container);

            expect(mockFileProperty.fillDisplay).toHaveBeenCalledWith(
                mockVault, 
                '[[File1]]', 
                expect.any(Function)
            );
        });
    });

    describe('createDeleteButton', () => {
        beforeEach(() => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);
        });

        test('should create button with correct classes and icon', () => {
            const container = document.createElement('div');
            const values = ['[[File1]]'];
            
            const button = multiFileProperty.createDeleteButton(values, mockUpdate, 0, container);

            expect(setIcon).toHaveBeenCalledWith(button, 'minus');
            expect(button.classList.add).toHaveBeenCalledWith('metadata-delete-button-inline-small');
        });

        test('should have onclick handler', () => {
            const container = document.createElement('div');
            const values = ['[[File1]]'];
            
            const button = multiFileProperty.createDeleteButton(values, mockUpdate, 0, container);

            expect(button.onclick).toBeDefined();
            expect(typeof button.onclick).toBe('function');
        });
    });

    describe('createAddButton', () => {
        beforeEach(() => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);
        });

        test('should create button with correct classes and icon', () => {
            const container = document.createElement('div');
            const values: any[] = [];
            
            const button = multiFileProperty.createAddButton(values, mockUpdate, container);

            expect(setIcon).toHaveBeenCalledWith(button, 'plus');
            expect(button.classList.add).toHaveBeenCalledWith('metadata-add-button-inline-small');
        });

        test('should have onclick handler', () => {
            const container = document.createElement('div');
            const values: any[] = [];
            
            const button = multiFileProperty.createAddButton(values, mockUpdate, container);

            expect(button.onclick).toBeDefined();
            expect(typeof button.onclick).toBe('function');
        });
    });

    describe('addProperty', () => {
        beforeEach(() => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document', 'Image']);
            multiFileProperty.vault = mockVault;
            // Mock reloadObjects method
            multiFileProperty.reloadObjects = jest.fn();
        });

        test('should call selectMultipleFile with correct parameters', async () => {
            const container = document.createElement('div');
            const values: any[] = [];

            await multiFileProperty.addProperty(values, mockUpdate, container);

            expect(selectMultipleFile).toHaveBeenCalledWith(
                mockVault,
                ['Document', 'Image'],
                { hint: 'Choisissez des fichiers Document ou Image' }
            );
        });

        test('should add files to values when files are selected', async () => {
            const container = document.createElement('div');
            const values: any[] = [];
            const mockFiles = [
                { getLink: () => '[[File1]]' },
                { getLink: () => '[[File2]]' }
            ];

            (selectMultipleFile as jest.Mock).mockResolvedValue(mockFiles);

            await multiFileProperty.addProperty(values, mockUpdate, container);

            expect(values).toEqual(['[[File1]]', '[[File2]]']);
            expect(mockUpdate).toHaveBeenCalledWith(['[[File1]]', '[[File2]]']);
        });

        test('should initialize values array if null', async () => {
            const container = document.createElement('div');
            let values: any = null;
            const mockFiles = [{ getLink: () => '[[File1]]' }];

            (selectMultipleFile as jest.Mock).mockResolvedValue(mockFiles);

            await multiFileProperty.addProperty(values, mockUpdate, container);

            expect(mockUpdate).toHaveBeenCalledWith(['[[File1]]']);
        });

        test('should handle no files selected', async () => {
            const container = document.createElement('div');
            const values: any[] = [];

            (selectMultipleFile as jest.Mock).mockResolvedValue(null);

            await multiFileProperty.addProperty(values, mockUpdate, container);

            expect(mockUpdate).not.toHaveBeenCalled();
        });

        test('should handle empty files array', async () => {
            const container = document.createElement('div');
            const values: any[] = [];

            (selectMultipleFile as jest.Mock).mockResolvedValue([]);

            await multiFileProperty.addProperty(values, mockUpdate, container);

            expect(mockUpdate).not.toHaveBeenCalled();
        });

        test('should call reloadObjects when files are added', async () => {
            const container = document.createElement('div');
            const values: any[] = [];
            const mockFiles = [{ getLink: () => '[[File1]]' }];

            (selectMultipleFile as jest.Mock).mockResolvedValue(mockFiles);

            await multiFileProperty.addProperty(values, mockUpdate, container);

            expect(multiFileProperty.reloadObjects).toHaveBeenCalledWith(values, mockUpdate);
        });
    });

    describe('enableDragAndDrop', () => {
        test('should exist and be callable', () => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);

            expect(() => multiFileProperty.enableDragAndDrop()).not.toThrow();
        });
    });

    describe('Integration', () => {
        test('should work with multiple classes in hint', () => {
            const classes = ['Document', 'Image', 'Video'];
            multiFileProperty = new MultiFileProperty('testFiles', classes);

            expect(multiFileProperty.getClasses().join(' ou ')).toBe('Document ou Image ou Video');
        });

        test('should handle single class in hint', () => {
            const classes = ['Document'];
            multiFileProperty = new MultiFileProperty('testFiles', classes);

            expect(multiFileProperty.getClasses().join(' ou ')).toBe('Document');
        });

        test('should maintain proper inheritance from ObjectProperty', () => {
            multiFileProperty = new MultiFileProperty('testFiles', ['Document']);

            expect(multiFileProperty.type).toBe('multiFile');
            expect(typeof multiFileProperty.fillDisplay).toBe('function');
        });
    });
});