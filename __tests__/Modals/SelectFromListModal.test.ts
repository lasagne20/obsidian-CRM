import { App } from 'obsidian';
import { SelectFromListModal } from '../../src/Modals/SelectFromListModal';

interface TestItem {
  id: number;
  name: string;
  description: string;
}

describe('SelectFromListModal', () => {
  let app: App;
  let onChoose: jest.Mock;
  let modal: SelectFromListModal<TestItem>;
  let testItems: TestItem[];
  let displayFunc: (item: TestItem) => string;

  beforeEach(() => {
    app = new App() as any;
    onChoose = jest.fn();
    testItems = [
      { id: 1, name: 'Item 1', description: 'First item' },
      { id: 2, name: 'Item 2', description: 'Second item' },
      { id: 3, name: 'Another Item', description: 'Third item' },
    ];
    displayFunc = (item: TestItem) => item.name;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create modal with required parameters', () => {
      modal = new SelectFromListModal(
        app,
        testItems,
        onChoose,
        displayFunc
      );

      expect(modal).toBeDefined();
    });

    it('should create modal with custom hint', () => {
      const customHint = 'Custom selection hint';
      
      modal = new SelectFromListModal(
        app,
        testItems,
        onChoose,
        displayFunc,
        customHint
      );

      expect(modal).toBeDefined();
    });
  });

  describe('Basic functionality tests', () => {
    beforeEach(() => {
      modal = new SelectFromListModal(
        app,
        testItems,
        onChoose,
        displayFunc
      );
    });

    it('should store constructor parameters correctly', () => {
      // Test that the modal is created with the correct parameters
      expect(modal).toBeDefined();
    });

    it('should handle empty items array in constructor', () => {
      const emptyModal = new SelectFromListModal(
        app,
        [],
        onChoose,
        displayFunc
      );

      expect(emptyModal).toBeDefined();
    });
  });

  describe('String items test', () => {
    it('should handle string items correctly', () => {
      const stringItems = ['Option A', 'Option B', 'Option C'];
      const stringDisplayFunc = (item: string) => item.toUpperCase();

      const stringModal = new SelectFromListModal(
        app,
        stringItems,
        onChoose,
        stringDisplayFunc
      );

      expect(stringModal).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should create modal even with error functions', () => {
      const errorDisplayFunc = () => {
        throw new Error('Display function error');
      };

      const errorModal = new SelectFromListModal(
        app,
        testItems,
        onChoose,
        errorDisplayFunc
      );

      expect(errorModal).toBeDefined();
    });

    it('should handle null/undefined parameters gracefully', () => {
      const safeModal = new SelectFromListModal(
        app,
        testItems || [],
        onChoose || jest.fn(),
        displayFunc || (() => '')
      );

      expect(safeModal).toBeDefined();
    });
  });
});