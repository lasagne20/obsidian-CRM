// Mock markdown-crm
export const Classe = jest.fn();

export const Vault = jest.fn().mockImplementation(() => ({
  getExtendedClasses: jest.fn(() => Promise.resolve([])),
  getDynamicClassFactory: jest.fn(() => null),
}));

// Static helpers used by FileSearchModal to resolve derived dates from frontmatter
export const RangeDateProperty = {
  parseDateValue: (value: any): [number, number] | null => {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : [value.getTime(), value.getTime()];
    }
    if (typeof value === 'number') return [value, value];
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : [date.getTime(), date.getTime()];
    }
    return null;
  },
  formatTimestamp: (timestamp: number): string => {
    const d = new Date(timestamp);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};