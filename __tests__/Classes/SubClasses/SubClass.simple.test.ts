import { SubClass } from '../../../Classes/SubClasses/SubClass';
import { Classe } from '../../../Classes/Classe';

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}));

// Test SubClass concrete implementation
class TestSubClass extends SubClass {
  subClassName = 'TestSubClass';
  static Properties = {};
  
  constructor(classe: typeof Classe, data: any = null) {
    super(classe, data);
  }
}

// Mock Classe constructor
const MockClasse = class MockClasse {
  static Properties = {};
  static className = 'MockClasse';
  static getConstructor() { return MockClasse; }
} as unknown as typeof Classe;

describe('SubClass - Simplified Tests', () => {
  let subClass: TestSubClass;

  beforeEach(() => {
    jest.clearAllMocks();
    subClass = new TestSubClass(MockClasse);
  });

  test('should create SubClass with basic properties', () => {
    expect(subClass.classe).toBe(MockClasse);
    expect(subClass.data).toBeNull();
    expect(subClass.id).toBe('mock-uuid-1234');
  });

  test('should create SubClass with provided data', () => {
    const initialData = { name: 'Test', value: 42 };
    const subClassWithData = new TestSubClass(MockClasse, initialData);
    
    expect(subClassWithData.data).toBe(initialData);
  });

  test('should get name from data object', () => {
    const mockData = { name: 'TestName' };
    subClass.data = mockData as any;
    
    expect(subClass.getName()).toBe('TestName');
  });

  test('should get name from plain object', () => {
    subClass.data = { name: 'PlainName' } as any;
    expect(subClass.getName()).toBe('PlainName');
  });

  test('should return empty string when no name', () => {
    subClass.data = { value: 42 } as any;
    expect(subClass.getName()).toBe('');
  });

  test('should get metadata', () => {
    const testData = { name: 'Test', value: 42 } as any;
    subClass.data = testData;
    
    expect(subClass.getMetadata()).toBe(testData);
  });

  test('should get specific metadata value', () => {
    subClass.data = { name: 'Test', count: 5 } as any;
    
    expect(subClass.getMetadataValue('name')).toBe('Test');
    expect(subClass.getMetadataValue('count')).toBe(5);
    expect(subClass.getMetadataValue('nonexistent')).toBeUndefined();
  });

  test('should handle parent relationship', () => {
    const mockParent = new TestSubClass(MockClasse);
    subClass.data = { parent: mockParent } as any;
    
    expect(subClass.getParent()).toBe(mockParent);
  });

  test('should return null when no parent', () => {
    subClass.data = { name: 'NoParent' } as any;
    expect(subClass.getParent()).toBeNull();
  });

  test('should get classe name', () => {
    expect(subClass.getClasse()).toBe('TestSubClass');
  });

  test('should get ID', () => {
    expect(subClass.getID()).toBe('mock-uuid-1234');
  });

  test('should get link format', () => {
    subClass.data = { name: 'TestName' } as any;
    expect(subClass.getLink()).toBe('[[TestName]]');
  });

  test('should get subClassName', () => {
    expect(subClass.getsubClassName()).toBe('TestSubClass');
  });

  test('should update metadata', async () => {
    subClass.data = { existing: 'value' } as any;
    await subClass.updateMetadata('newKey', 'newValue');
    
    expect((subClass.data as any).newKey).toBe('newValue');
    expect((subClass.data as any).existing).toBe('value');
  });

  test('should handle falsy metadata values correctly', () => {
    subClass.data = {
      zeroValue: 0,
      falseValue: false,
      emptyString: '',
      nullValue: null
    } as any;
    
    // getMetadataValue retourne undefined si la valeur est falsy
    expect(subClass.getMetadataValue('zeroValue')).toBeUndefined();
    expect(subClass.getMetadataValue('falseValue')).toBeUndefined();
    expect(subClass.getMetadataValue('emptyString')).toBeUndefined();
    expect(subClass.getMetadataValue('nullValue')).toBeUndefined();
  });

  test('should handle metadata values that are truthy', () => {
    subClass.data = {
      stringValue: 'test',
      numberValue: 1,
      objectValue: { key: 'value' }
    } as any;
    
    expect(subClass.getMetadataValue('stringValue')).toBe('test');
    expect(subClass.getMetadataValue('numberValue')).toBe(1);
    expect(subClass.getMetadataValue('objectValue')).toEqual({ key: 'value' });
  });
});