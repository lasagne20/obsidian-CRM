import { App } from 'obsidian';
import { Vault } from 'markdown-crm';
import { ClassFileModals } from '../../src/Modals/Modals';
import { ObsidianApp } from '../../src/App';

// Mock the FileSearchModal
jest.mock('../../src/Modals/FileSearchModal', () => ({
  FileSearchModal: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
    close: jest.fn(),
    onChoose: jest.fn(),
  })),
}));

describe('ClassFileModals', () => {
  let app: App;
  let vault: Vault;
  let obsidianApp: ObsidianApp;
  let onMetadataUpdate: jest.Mock;
  let classFileModals: ClassFileModals;

  beforeEach(() => {
    app = new App() as any;
    
    vault = {
      getExtendedClasses: jest.fn().mockResolvedValue(['Personne']),
      getDynamicClassFactory: jest.fn().mockReturnValue(null)
    } as any;
    
    obsidianApp = {
      sendNotice: jest.fn(),
    } as any;
    onMetadataUpdate = jest.fn().mockResolvedValue(undefined);
    
    classFileModals = new ClassFileModals(app, vault, obsidianApp, onMetadataUpdate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create ClassFileModals instance', () => {
      expect(classFileModals).toBeDefined();
      expect(classFileModals).toBeInstanceOf(ClassFileModals);
    });
  });

  describe('Basic functionality', () => {
    beforeEach(() => {
      // Mock console methods to avoid noise in tests
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call vault.getExtendedClasses with single class', async () => {
      vault.getExtendedClasses = jest.fn().mockResolvedValue(['Personne']);

      await classFileModals.openClassFileSuggester('Personne');

      expect(vault.getExtendedClasses).toHaveBeenCalledWith(['Personne']);
    });

    it('should call vault.getExtendedClasses with array of classes', async () => {
      const classNames = ['Personne', 'Institution'];
      vault.getExtendedClasses = jest.fn().mockResolvedValue(classNames);

      await classFileModals.openClassFileSuggester(classNames);

      expect(vault.getExtendedClasses).toHaveBeenCalledWith(classNames);
    });

    it('should handle empty class array', async () => {
      vault.getExtendedClasses = jest.fn().mockResolvedValue([]);

      await classFileModals.openClassFileSuggester([]);

      expect(vault.getExtendedClasses).toHaveBeenCalledWith([]);
    });
  });
});