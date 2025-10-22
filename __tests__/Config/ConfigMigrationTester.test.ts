import { ConfigMigrationTester } from '../../Utils/Config/ConfigMigrationTester';
import { DynamicClassFactory } from '../../Utils/Config/DynamicClassFactory';

// Mock des dépendances
jest.mock('../../Utils/Config/DynamicClassFactory', () => ({
    DynamicClassFactory: {
        getInstance: jest.fn()
    }
}));

describe('ConfigMigrationTester', () => {
    let tester: ConfigMigrationTester;
    let mockFactory: any;

    beforeEach(() => {
        mockFactory = {
            createInstance: jest.fn(),
            getAvailableClasses: jest.fn(),
            getClass: jest.fn(),
            loadClassFromConfig: jest.fn()
        };

        (DynamicClassFactory.getInstance as jest.Mock).mockReturnValue(mockFactory);
        
        tester = new ConfigMigrationTester('./config');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('testAllConfigurations', () => {
        it('should return success and failed arrays', async () => {
            mockFactory.getAvailableClasses.mockResolvedValue(['TestClass']);
            mockFactory.getClass.mockResolvedValue({
                className: 'TestClass',
                classIcon: 'test',
                Properties: { prop1: {} }
            });

            const result = await tester.testAllConfigurations();

            expect(result.success).toEqual(['TestClass']);
            expect(result.failed).toEqual([]);
        });

        it('should handle failed configurations', async () => {
            mockFactory.getAvailableClasses.mockResolvedValue(['TestClass', 'FailClass']);
            mockFactory.getClass
                .mockResolvedValueOnce({
                    className: 'TestClass',
                    classIcon: 'test',
                    Properties: { prop1: {} }
                })
                .mockRejectedValueOnce(new Error('Failed to load FailClass'));

            const result = await tester.testAllConfigurations();

            expect(result.success).toEqual(['TestClass']);
            expect(result.failed).toEqual(['FailClass']);
        });
    });

    describe('compareClassProperties', () => {
        it('should compare class properties successfully', async () => {
            const legacyClass = {
                Properties: {
                    prop1: { type: 'text', name: 'Property 1' },
                    prop2: { type: 'number', name: 'Property 2' }
                }
            };

            mockFactory.getClass.mockResolvedValue({
                className: 'TestClass',
                classIcon: 'test',
                Properties: {
                    prop1: { type: 'text', name: 'Property 1' },
                    prop2: { type: 'number', name: 'Property 2' }
                }
            });

            const result = await tester.compareClassProperties('TestClass', legacyClass);

            expect(result.matching).toEqual(['prop1', 'prop2']);
            expect(result.missing).toHaveLength(0);
            expect(result.extra).toHaveLength(0);
        });

        it('should detect property differences', async () => {
            const legacyClass = {
                Properties: {
                    prop1: { type: 'text', name: 'Property 1' },
                    prop2: { type: 'number', name: 'Property 2' }
                }
            };

            mockFactory.getClass.mockResolvedValue({
                className: 'TestClass',
                classIcon: 'test',
                Properties: {
                    prop1: { type: 'text', name: 'Property 1' },
                    prop3: { type: 'date', name: 'Property 3' }
                }
            });

            const result = await tester.compareClassProperties('TestClass', legacyClass);

            expect(result.matching).toEqual(['prop1']);
            expect(result.missing).toContain('prop2');
            expect(result.extra).toContain('prop3');
        });
    });

    describe('testCreateInstance', () => {
        it('should test instance creation successfully', async () => {
            const mockApp = {} as any;
            const mockVault = {} as any;
            const mockFile = { path: 'test.md', name: 'test.md' };
            const mockInstance = { 
                getClasse: () => 'TestClass',
                getProperties: () => ({ prop1: 'value1' })
            };
            
            mockFactory.createInstance.mockResolvedValue(mockInstance);

            const result = await tester.testCreateInstance('TestClass', mockApp, mockVault, mockFile);

            expect(result).toBe(true);
        });

        it('should handle instance creation errors', async () => {
            const mockApp = {} as any;
            const mockVault = {} as any;
            const mockFile = { path: 'test.md', name: 'test.md' };
            
            mockFactory.createInstance.mockRejectedValue(new Error('Creation failed'));

            const result = await tester.testCreateInstance('TestClass', mockApp, mockVault, mockFile);

            expect(result).toBe(false);
        });
    });

    describe('runFullTest', () => {
        it('should run full test suite without errors', async () => {
            const mockApp = {} as any;
            const mockVault = {} as any;
            const legacyClasses = {
                TestClass: {
                    Properties: { prop1: {} }
                }
            };

            mockFactory.getAvailableClasses.mockResolvedValue(['TestClass']);
            mockFactory.getClass.mockResolvedValue({
                className: 'TestClass',
                classIcon: 'test',
                Properties: { prop1: {} }
            });
            mockFactory.createInstance.mockResolvedValue({ 
                getClasse: () => 'TestClass',
                getProperties: () => ({ prop1: 'value1' })
            });

            // runFullTest returns void, so we just test it doesn't throw
            await expect(tester.runFullTest(mockApp, mockVault, legacyClasses)).resolves.toBeUndefined();
        });
    });
});