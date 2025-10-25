import { Classe } from '../../../../Classes/Classe';
import { CentreAere } from '../../../../Classes/OldClasses/Institutions/CentreAere';

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'centre-aere-uuid')
}));

// Mock Classe constructor
const MockClasse = class MockClasse {
  static Properties = {};
  static className = 'Institution';
  static getConstructor() { return MockClasse; }
} as unknown as typeof Classe;

describe('CentreAere', () => {
  let centreAere: CentreAere;

  beforeEach(() => {
    jest.clearAllMocks();
    centreAere = new CentreAere(MockClasse);
  });

  test('should create CentreAere with correct subClassName', () => {
    expect(centreAere.subClassName).toBe('Centre Aéré');
    expect(centreAere.subClassIcon).toBe('box');
  });

  test('should inherit from SubClass', () => {
    expect(centreAere.classe).toBe(MockClasse);
    expect(centreAere.id).toBe('centre-aere-uuid');
  });

  test('should return correct constructor', () => {
    expect(centreAere.getConstructor()).toBe(CentreAere);
  });

  test('should handle data initialization', () => {
    const testData = { 
      name: 'Centre Aéré Les Petits Loups',
      adresse: '123 Rue de la Nature',
      capacite: 50
    };
    
    const centreAereWithData = new CentreAere(MockClasse, testData as any);
    expect(centreAereWithData.data).toBe(testData);
    expect(centreAereWithData.getName()).toBe('Centre Aéré Les Petits Loups');
  });

  test('should get classe name correctly', () => {
    expect(centreAere.getClasse()).toBe('Centre Aéré');
  });

  test('should create link format', () => {
    centreAere.data = { name: 'Centre Test' } as any;
    expect(centreAere.getLink()).toBe('[[Centre Test]]');
  });

  test('should handle metadata operations', () => {
    const metadata = {
      name: 'Centre Municipal',
      type: 'public',
      ouverture: '2020-01-01'
    };
    
    centreAere.data = metadata as any;
    
    expect(centreAere.getMetadata()).toBe(metadata);
    expect(centreAere.getMetadataValue('type')).toBe('public');
    expect(centreAere.getMetadataValue('ouverture')).toBe('2020-01-01');
  });

  test('should update metadata', async () => {
    centreAere.data = { name: 'Centre Test' } as any;
    
    await centreAere.updateMetadata('capacite', 75);
    
    expect((centreAere.data as any).capacite).toBe(75);
    expect((centreAere.data as any).name).toBe('Centre Test');
  });

  test('should handle parent relationships', () => {
    const parentCentre = new CentreAere(MockClasse);
    parentCentre.data = { name: 'Centre Parent' } as any;
    
    centreAere.data = { 
      name: 'Centre Enfant',
      parent: parentCentre 
    } as any;
    
    expect(centreAere.getParent()).toBe(parentCentre);
  });

  test('should handle empty data gracefully', () => {
    expect(centreAere.getName()).toBe('');
    expect(centreAere.getParent()).toBeNull();
    expect(centreAere.getMetadataValue('anything')).toBeUndefined();
  });
});