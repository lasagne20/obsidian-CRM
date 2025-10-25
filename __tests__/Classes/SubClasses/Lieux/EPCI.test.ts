import { Classe } from '../../../../Classes/Classe';
import { EPCI } from '../../../../Classes/OldClasses/Lieux/EPCI';

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'epci-uuid')
}));

// Mock all the property classes
jest.mock('../../../../Utils/Properties/LinkProperty');
jest.mock('../../../../Utils/Properties/EmailProperty');
jest.mock('../../../../Utils/Properties/PhoneProperty');
jest.mock('../../../../Utils/Properties/AdressProperty');
jest.mock('../../../../Utils/Properties/RatingProperty');
jest.mock('../../../../Utils/Properties/ObjectProperty');

// Mock Classe constructor
const MockClasse = class MockClasse {
  static Properties = {};
  static className = 'Lieu';
  static getConstructor() { return MockClasse; }
} as unknown as typeof Classe;

describe('EPCI', () => {
  let epci: EPCI;

  beforeEach(() => {
    jest.clearAllMocks();
    epci = new EPCI(MockClasse);
  });

  test('should create EPCI with correct subClassName', () => {
    expect(epci.subClassName).toBe('EPCI');
    expect(epci.subClassIcon).toBe('box');
  });

  test('should inherit from SubClass', () => {
    expect(epci.classe).toBe(MockClasse);
    expect(epci.id).toBe('epci-uuid');
  });

  test('should return correct constructor', () => {
    expect(epci.getConstructor()).toBe(EPCI);
  });

  test('should have static properties defined', () => {
    expect(EPCI.Properties).toBeDefined();
    expect(EPCI.Properties.site).toBeDefined();
    expect(EPCI.Properties.email).toBeDefined();
    expect(EPCI.Properties.telephone).toBeDefined();
    expect(EPCI.Properties.adresse).toBeDefined();
    expect(EPCI.Properties.priority).toBeDefined();
    expect(EPCI.Properties.services).toBeDefined();
  });

  test('should handle data initialization', () => {
    const testData = { 
      name: 'CC du Pays de Bièvre',
      code: '243800984',
      population: 25000,
      site: 'https://www.cc-pays-bievre.fr'
    };
    
    const epciWithData = new EPCI(MockClasse, testData as any);
    expect(epciWithData.data).toBe(testData);
    expect(epciWithData.getName()).toBe('CC du Pays de Bièvre');
  });

  test('should get classe name correctly', () => {
    expect(epci.getClasse()).toBe('EPCI');
  });

  test('should handle metadata operations', () => {
    const metadata = {
      name: 'Métropole de Grenoble',
      code: '200040715',
      type: 'CA',
      population: 450000
    };
    
    epci.data = metadata as any;
    
    expect(epci.getMetadata()).toBe(metadata);
    expect(epci.getMetadataValue('code')).toBe('200040715');
    expect(epci.getMetadataValue('type')).toBe('CA');
    expect(epci.getMetadataValue('population')).toBe(450000);
  });

  test('should update metadata', async () => {
    epci.data = { name: 'EPCI Test', code: '123456789' } as any;
    
    await epci.updateMetadata('population', 15000);
    
    expect((epci.data as any).population).toBe(15000);
    expect((epci.data as any).name).toBe('EPCI Test');
    expect((epci.data as any).code).toBe('123456789');
  });

  test('should handle parent relationships', () => {
    const parentEPCI = new EPCI(MockClasse);
    parentEPCI.data = { name: 'EPCI Parent' } as any;
    
    epci.data = { 
      name: 'EPCI Enfant',
      parent: parentEPCI 
    } as any;
    
    expect(epci.getParent()).toBe(parentEPCI);
  });

  test('should create link format', () => {
    epci.data = { name: 'CC Test' } as any;
    expect(epci.getLink()).toBe('[[CC Test]]');
  });

  test('should handle empty data gracefully', () => {
    expect(epci.getName()).toBe('');
    expect(epci.getParent()).toBeNull();
    expect(epci.getMetadataValue('anything')).toBeUndefined();
  });

  test('should get properties from both subclass and base class', () => {
    const allProps = epci.getAllProperties();
    
    // Should include EPCI-specific properties
    expect(allProps.site).toBeDefined();
    expect(allProps.email).toBeDefined();
    expect(allProps.telephone).toBeDefined();
    expect(allProps.adresse).toBeDefined();
  });
});