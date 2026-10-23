import { App } from 'obsidian';
import { Vault } from 'markdown-crm';
import { ClassFileModals } from '../../src/Modals/Modals';
import { ObsidianApp } from '../../src/App';
import { FileSearchModal } from '../../src/Modals/FileSearchModal';

// Mock FileSearchModal at module level
jest.mock('../../src/Modals/FileSearchModal');

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

  describe('Modal close behavior', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call onFileSelected with null when modal is closed without selection', () => {
      const onFileSelected = jest.fn();
      let capturedCallback: any;
      
      // Mock FileSearchModal to capture the callback passed to it
      (FileSearchModal as jest.MockedClass<typeof FileSearchModal>).mockImplementationOnce(
        function(this: any, app: any, vaultParam: any, onChoose: any, classNames: any, options: any) {
          capturedCallback = onChoose;
          return this;
        } as any
      );

      // Call showClassFileSuggester directly to test the modal callback behavior
      classFileModals.showClassFileSuggester(
        ['Personne'], 
        class {}, 
        [], 
        {},
        onFileSelected
      );
      
      // Verify callback was captured
      expect(capturedCallback).toBeDefined();
      
      // Simulate modal being closed without selection (user pressed Escape)
      // This should trigger the null check in showClassFileSuggester callback
      capturedCallback(null);
      
      // Should have been called with null when user closes without selecting
      expect(onFileSelected).toHaveBeenCalledWith(null);
      expect(onFileSelected).toHaveBeenCalledTimes(1);
    });

    it('should not crash when onFileSelected is not provided and modal is closed', () => {
      let capturedCallback: any;
      
      // Mock FileSearchModal to capture the callback
      (FileSearchModal as jest.MockedClass<typeof FileSearchModal>).mockImplementationOnce(
        function(this: any, app: any, vaultParam: any, onChoose: any, classNames: any, options: any) {
          capturedCallback = onChoose;
          return this;
        } as any
      );

      // Call showClassFileSuggester without onFileSelected callback
      classFileModals.showClassFileSuggester(
        ['Personne'], 
        class {},
        [],
        {}
      );
      
      // Verify callback was captured
      expect(capturedCallback).toBeDefined();

      // Simulate modal being closed without selection
      // Should not throw even when onFileSelected is undefined
      expect(() => capturedCallback(null)).not.toThrow();
    });
  });

  describe('showClassFileSuggester - passage de la searchConfig', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
    });

    it('passe la searchConfig résolue dans les args du FileSearchModal', async () => {
      // Régression : la config était perdue entre showClassFileSuggester et le
      // constructeur du modal (absente de l'objet args -> chips jamais rendues)
      const searchConfig = {
        properties: [{ name: 'etat', icon: 'clipboard-list' }],
        sort: 'date',
        sortDirection: 'desc',
        titleTemplate: '{date} - Action - {current}'
      };

      await classFileModals.showClassFileSuggester(
        ['Action'], null, [], { Action: 'smile-plus' }, undefined, undefined, searchConfig
      );

      expect(FileSearchModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        ['Action'],
        expect.objectContaining({ searchConfig })
      );
    });

    it('sans searchConfig, les args n\'en contiennent pas', async () => {
      await classFileModals.showClassFileSuggester(
        ['Action'], null, [], { Action: 'smile-plus' }, undefined, undefined, undefined
      );

      const call = (FileSearchModal as jest.Mock).mock.calls.at(-1);
      expect(call[4].searchConfig).toBeUndefined();
    });
  });
});