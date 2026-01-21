// Mock Obsidian API
export const App = jest.fn().mockImplementation(() => ({
  vault: {
    getFiles: jest.fn(() => []),
    getMarkdownFiles: jest.fn(() => []),
    getName: jest.fn(() => 'mock-vault'),
  },
  metadataCache: {
    getFileCache: jest.fn(() => ({})),
  },
  workspace: {
    getActiveFile: jest.fn(() => null),
  },
}));

export const TFile = jest.fn().mockImplementation((path) => ({
  path,
  basename: path?.split('/').pop()?.replace(/\.[^/.]+$/, '') || '',
  name: path?.split('/').pop() || '',
  extension: path?.split('.').pop() || '',
}));

export class FuzzySuggestModal {
  containerEl: any;
  app: any;
  
  constructor(app?: any) {
    this.app = app;
    this.containerEl = {
      createDiv: jest.fn(() => ({
        textContent: '',
        style: {},
        appendChild: jest.fn(),
      })),
      querySelector: jest.fn(() => ({
        prepend: jest.fn(),
      })),
    };
  }
  
  onOpen() {}
  close() {}
  open() {}
  renderSuggestion() {}
  getItemText() { return ''; }
  onChooseItem() {}
  
  // getSuggestions est intentionnellement absent pour permettre l'override
}

export const SuggestModal = jest.fn().mockImplementation(() => ({
  containerEl: {
    createDiv: jest.fn(() => ({
      textContent: '',
      style: {},
      appendChild: jest.fn(),
    })),
    querySelector: jest.fn(() => ({
      prepend: jest.fn(),
    })),
  },
  onOpen: jest.fn(),
  close: jest.fn(),
  open: jest.fn(),
  getSuggestions: jest.fn(() => []),
  renderSuggestion: jest.fn(),
  selectSuggestion: jest.fn(),
}));

export const Modal = jest.fn().mockImplementation(() => ({
  containerEl: {
    createDiv: jest.fn(() => ({
      textContent: '',
      style: {},
      appendChild: jest.fn(),
    })),
    querySelector: jest.fn(() => ({
      prepend: jest.fn(),
    })),
  },
  onOpen: jest.fn(),
  close: jest.fn(),
  open: jest.fn(),
}));

export const setIcon = jest.fn();
export const prepareFuzzySearch = jest.fn(() => () => ({ score: 1, matches: [] }));
export const FuzzyMatch = jest.fn();