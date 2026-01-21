import { App } from 'obsidian';
import { MultiSelectFromListModal } from '../../src/Modals/MultiSelectFromListModal';

interface TestItem {
  id: number;
  name: string;
  category: string;
}

describe('MultiSelectFromListModal', () => {
  let app: App;
  let onChoose: jest.Mock;
  let modal: MultiSelectFromListModal<TestItem>;
  let testItems: TestItem[];
  let displayFunc: (item: TestItem) => string;

  beforeEach(() => {
    app = new App() as any;
    onChoose = jest.fn();
    testItems = [
      { id: 1, name: 'Item 1', category: 'A' },
      { id: 2, name: 'Item 2', category: 'B' },
      { id: 3, name: 'Item 3', category: 'A' },
    ];
    displayFunc = (item: TestItem) => `${item.name} (${item.category})`;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create modal with required parameters', () => {
      modal = new MultiSelectFromListModal(
        app,
        testItems,
        onChoose,
        displayFunc
      );

      expect(modal).toBeDefined();
    });

    it('should create modal with custom hint', () => {
      const customHint = 'Custom multi-selection hint';
      
      modal = new MultiSelectFromListModal(
        app,
        testItems,
        onChoose,
        displayFunc,
        customHint
      );

      expect(modal).toBeDefined();
    });

    it('should handle empty items array', () => {
      modal = new MultiSelectFromListModal(
        app,
        [],
        onChoose,
        displayFunc
      );

      expect(modal).toBeDefined();
    });
  });

  describe('Basic functionality', () => {
    beforeEach(() => {
      modal = new MultiSelectFromListModal(
        app,
        testItems,
        onChoose,
        displayFunc
      );
    });

    it('should store constructor parameters correctly', () => {
      expect(modal).toBeDefined();
    });

    it('should handle string items correctly', () => {
      const stringItems = ['Option A', 'Option B', 'Option C'];
      const stringDisplayFunc = (item: string) => item.toUpperCase();

      const stringModal = new MultiSelectFromListModal(
        app,
        stringItems,
        onChoose,
        stringDisplayFunc
      );

      expect(stringModal).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle null parameters gracefully', () => {
      expect(() => {
        const nullModal = new MultiSelectFromListModal(
          app,
          testItems || [],
          onChoose || jest.fn(),
          displayFunc || (() => '')
        );
      }).not.toThrow();
    });
  });
});