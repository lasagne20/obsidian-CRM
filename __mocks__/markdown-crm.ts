// Mock markdown-crm
export const Classe = jest.fn();

export const Vault = jest.fn().mockImplementation(() => ({
  getExtendedClasses: jest.fn(() => Promise.resolve([])),
  getDynamicClassFactory: jest.fn(() => null),
}));