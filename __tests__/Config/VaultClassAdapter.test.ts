import { VaultClassAdapter } from '../../Utils/VaultClassAdapter';
import { DynamicClassFactory } from '../../Utils/Config/DynamicClassFactory';
import { MyVault } from '../../Utils/MyVault';
import { TFile } from '../../Utils/App';

// Mock des dépendances
jest.mock('../../Utils/Config/DynamicClassFactory', () => ({
    DynamicClassFactory: {
        getInstance: jest.fn()
    }
}));

describe('VaultClassAdapter', () => {
    let vaultAdapter: VaultClassAdapter;
    let mockVault: jest.Mocked<MyVault>;
    let mockDynamicFactory: jest.Mocked<DynamicClassFactory>;
    let mockApp: any;

    beforeEach(() => {
        mockApp = {
            metadataCache: {
                getFileCache: jest.fn()
            }
        };

        mockVault = {
            app: mockApp,
            files: {},
            getFileData: jest.fn(),
            getPersonalName: jest.fn()
        } as any;

        mockDynamicFactory = {
            createInstance: jest.fn(),
            getClass: jest.fn(),
            getAvailableClasses: jest.fn(),
            clearCache: jest.fn()
        } as any;

        (DynamicClassFactory.getInstance as jest.Mock).mockReturnValue(mockDynamicFactory);
        
        vaultAdapter = new VaultClassAdapter(mockVault, './config');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getFromFile', () => {
        let mockFile: TFile;

        beforeEach(() => {
            mockFile = {
                path: '/test/file.md',
                name: 'file.md',
                basename: 'file',
                extension: 'md'
            } as any;
        });

        it('should create class instance from file with metadata classe', async () => {
            const mockMetadata = { classe: 'Personne' };
            const mockInstance = { getClasse: () => 'Personne' };

            mockApp.metadataCache.getFileCache.mockReturnValue({
                frontmatter: mockMetadata
            });
            mockDynamicFactory.createInstance.mockResolvedValue(mockInstance as any);

            const result = await vaultAdapter.getFromFile(mockFile);

            expect(result).toBe(mockInstance);
            expect(mockDynamicFactory.createInstance).toHaveBeenCalledWith(
                'Personne',
                mockVault.app,
                mockVault,
                mockFile
            );
        });

        it('should infer class type from file path when no metadata', async () => {
            mockFile.path = '/institutions/test-institution.md';
            
            mockApp.metadataCache.getFileCache.mockReturnValue({});
            mockDynamicFactory.getAvailableClasses.mockResolvedValue([
                'Personne', 'Institution', 'Lieu'
            ]);
            mockDynamicFactory.createInstance.mockResolvedValue({} as any);

            const result = await vaultAdapter.getFromFile(mockFile);

            expect(mockDynamicFactory.createInstance).toHaveBeenCalledWith(
                'Institution',
                mockVault.app,
                mockVault,
                mockFile
            );
        });

        it('should return null when class type cannot be determined', async () => {
            mockFile.path = '/unknown/path.md';
            
            mockApp.metadataCache.getFileCache.mockReturnValue({});
            mockDynamicFactory.getAvailableClasses.mockResolvedValue([
                'Personne', 'Institution', 'Lieu'
            ]);

            const result = await vaultAdapter.getFromFile(mockFile);

            expect(result).toBeNull();
            expect(mockDynamicFactory.createInstance).not.toHaveBeenCalled();
        });

        it('should handle creation errors gracefully', async () => {
            const mockMetadata = { classe: 'InvalidClass' };
            
            mockApp.metadataCache.getFileCache.mockReturnValue({
                frontmatter: mockMetadata
            });
            mockDynamicFactory.createInstance.mockRejectedValue(new Error('Class not found'));

            const result = await vaultAdapter.getFromFile(mockFile);

            expect(result).toBeNull();
        });

        it('should detect class from plural path names', async () => {
            mockFile.path = '/personnes/john-doe.md';
            
            mockApp.metadataCache.getFileCache.mockReturnValue({});
            mockDynamicFactory.getAvailableClasses.mockResolvedValue([
                'Personne', 'Institution', 'Lieu'
            ]);
            mockDynamicFactory.createInstance.mockResolvedValue({} as any);

            await vaultAdapter.getFromFile(mockFile);

            expect(mockDynamicFactory.createInstance).toHaveBeenCalledWith(
                'Personne',
                mockVault.app,
                mockVault,
                mockFile
            );
        });
    });

    describe('getClass', () => {
        it('should return dynamic class constructor', async () => {
            const mockClass = class TestClass {};
            mockDynamicFactory.getClass.mockResolvedValue(mockClass as any);

            const result = await vaultAdapter.getClass('TestClass');

            expect(result).toBe(mockClass);
            expect(mockDynamicFactory.getClass).toHaveBeenCalledWith('TestClass');
        });
    });

    describe('getAvailableClasses', () => {
        it('should return available class names from factory', async () => {
            const mockClasses = ['Personne', 'Institution', 'Lieu'];
            mockDynamicFactory.getAvailableClasses.mockResolvedValue(mockClasses);

            const result = await vaultAdapter.getAvailableClasses();

            expect(result).toEqual(mockClasses);
            expect(mockDynamicFactory.getAvailableClasses).toHaveBeenCalled();
        });
    });

    describe('clearCache', () => {
        it('should clear factory cache', () => {
            vaultAdapter.clearCache();

            expect(mockDynamicFactory.clearCache).toHaveBeenCalled();
        });
    });

    describe('determineClassType (private method testing via public interface)', () => {
        it('should prioritize metadata classe over path inference', async () => {
            const mockFile = {
                path: '/institutions/but-really-personne.md',
                name: 'but-really-personne.md'
            } as any;
            
            const mockMetadata = { classe: 'Personne' };
            
            mockApp.metadataCache.getFileCache.mockReturnValue({
                frontmatter: mockMetadata
            });
            mockDynamicFactory.createInstance.mockResolvedValue({} as any);

            await vaultAdapter.getFromFile(mockFile);

            expect(mockDynamicFactory.createInstance).toHaveBeenCalledWith(
                'Personne',
                expect.anything(),
                expect.anything(),
                expect.anything()
            );
        });

        it('should handle case insensitive path matching', async () => {
            const mockFile = {
                path: '/INSTITUTIONS/test.md',
                name: 'test.md'
            } as any;
            
            mockApp.metadataCache.getFileCache.mockReturnValue({});
            mockDynamicFactory.getAvailableClasses.mockResolvedValue(['Institution']);
            mockDynamicFactory.createInstance.mockResolvedValue({} as any);

            await vaultAdapter.getFromFile(mockFile);

            expect(mockDynamicFactory.createInstance).toHaveBeenCalledWith(
                'Institution',
                expect.anything(),
                expect.anything(),
                expect.anything()
            );
        });
    });
});