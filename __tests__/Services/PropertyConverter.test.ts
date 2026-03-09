// Mock obsidian
jest.mock('obsidian');

// Replicate convertPropertyValue logic for testing
async function convertPropertyValue(
  plugin: any,
  propertyConfig: any,
  value: any,
  createdEntities: Map<string, any> = new Map()
): Promise<any> {
  if (value === null || value === undefined) {
    return value;
  }

  const propType = propertyConfig.type;

  switch (propType) {
    case 'FileProperty':
      // Handle link to another entity
      if (typeof value === 'string') {
        // Check if we already created this entity in this batch
        const existingEntity = createdEntities.get(value);
        if (existingEntity) {
            const file = existingEntity.getFile();
            const filename = file.getName ? file.getName() : file.name;
            return `[[${filename}]]`;
          }

          // Search for existing file or create it
          const classes = propertyConfig.classes || [];
          if (classes.length > 0) {
            // Try to find existing file
            const files = plugin.app.vault.getMarkdownFiles();
            const existingFile = files.find((f: any) => 
              f.basename.toLowerCase() === value.toLowerCase() &&
              f.path.includes(classes[0]) // Check if in correct folder
            );

            if (existingFile) {
              // Return wikilink format [[filename]]
              return `[[${existingFile.basename}]]`;
            }

            // If not found, create the linked entity
            const ClassConstructor = plugin.vault.constructor.classes[classes[0]];
            if (ClassConstructor) {
              const newEntity = await plugin.vault.createFile(ClassConstructor, value);
              createdEntities.set(value, newEntity);
              const file = newEntity.getFile();
              const filename = file.getName ? file.getName() : file.name;
              return `[[${filename}]]`;
            }
          }
        }
        return value;

    case 'ObjectProperty':
      // Handle nested properties
      if (typeof value === 'object' && !Array.isArray(value) && propertyConfig.properties) {
        const convertedObject: any = {};
        for (const [subKey, subValue] of Object.entries(value)) {
          const subPropConfig = propertyConfig.properties[subKey];
          if (subPropConfig) {
            convertedObject[subKey] = await convertPropertyValue(
              plugin,
              subPropConfig, 
              subValue, 
              createdEntities
            );
          } else {
            convertedObject[subKey] = subValue;
          }
        }
        return convertedObject;
      }
      return value;

    case 'MultiSelectProperty':
      // Ensure it's an array
      if (!Array.isArray(value)) {
        return [value];
      }
      return value;

    case 'PhoneProperty':
      // Normalize phone format if needed
      if (typeof value === 'string') {
        // Keep the value as-is, normalization done by AI
        return value;
      }
      return value;

    default:
      // For other types (Property, EmailProperty, LinkProperty, etc.)
      return value;
  }
}

describe('PropertyConverter', () => {
  let plugin: any;
  let mockVault: any;
  let mockObsidianApp: any;

  beforeEach(() => {
    // Mock vault
    mockVault = {
      constructor: {
        classes: {
          Institution: class MockInstitution {
            static className = 'Institution';
          }
        }
      },
      createFile: jest.fn().mockResolvedValue({
        getFile: () => ({ getName: () => 'Test', name: 'Test' })
      }),
      getFromFile: jest.fn().mockImplementation((file) => {
        // Not used anymore since we return strings directly
        return Promise.resolve({
          getFile: () => ({ getName: () => file.basename, name: file.basename })
        });
      }),
      getDynamicClassFactory: jest.fn().mockReturnValue({
        createInstanceFromDataObject: jest.fn().mockResolvedValue({
          getFile: () => ({ getName: () => 'Created', name: 'Created' })
        })
      })
    };

    // Mock ObsidianApp
    mockObsidianApp = {
      toIFile: jest.fn((file) => file)
    };

    // Mock App
    const mockApp = {
      vault: {
        getMarkdownFiles: jest.fn(() => [
          { basename: 'Existing', path: 'Institution/Existing.md' }
        ])
      }
    } as any;

    // Create plugin instance
    plugin = {
      app: mockApp,
      vault: mockVault,
      obsidianApp: mockObsidianApp
    };
  });

  describe('FileProperty conversion', () => {
    it('should return existing file if found', async () => {
      const propertyConfig = {
        type: 'FileProperty',
        classes: ['Institution']
      };

      const result = await convertPropertyValue(plugin, propertyConfig, 'Existing');

      expect(result).toBe('[[Existing]]');
    });

    it('should create new entity if not found', async () => {
      const propertyConfig = {
        type: 'FileProperty',
        classes: ['Institution']
      };

      const result = await convertPropertyValue(plugin, propertyConfig, 'NewInstitution');

      expect(mockVault.createFile).toHaveBeenCalled();
      expect(result).toBe('[[Test]]');
    });

    it('should reuse created entity from cache', async () => {
      const propertyConfig = {
        type: 'FileProperty',
        classes: ['Institution']
      };

      const createdEntities = new Map();
      const cachedEntity = {
        getFile: () => ({ getName: () => 'Cached', name: 'Cached' })
      };
      createdEntities.set('CachedInstitution', cachedEntity);

      const result = await convertPropertyValue(
        plugin,
        propertyConfig,
        'CachedInstitution',
        createdEntities
      );

      expect(result).toBe('[[Cached]]');
      expect(mockVault.createFile).not.toHaveBeenCalled();
    });
  });

  describe('ObjectProperty conversion', () => {
    it('should convert nested properties recursively', async () => {
      const propertyConfig = {
        type: 'ObjectProperty',
        properties: {
          institution: {
            type: 'FileProperty',
            classes: ['Institution']
          },
          poste: {
            type: 'Property'
          }
        }
      };

      const value = {
        institution: 'Existing',
        poste: 'Directeur'
      };

      const result = await convertPropertyValue(plugin, propertyConfig, value);

      expect(result).toEqual({
        institution: '[[Existing]]',
        poste: 'Directeur'
      });
    });

    it('should handle empty object properties', async () => {
      const propertyConfig = {
        type: 'ObjectProperty',
        properties: {}
      };

      const value = { key: 'value' };
      const result = await convertPropertyValue(plugin, propertyConfig, value);

      expect(result).toEqual({ key: 'value' });
    });
  });

  describe('MultiSelectProperty conversion', () => {
    it('should convert single value to array', async () => {
      const propertyConfig = {
        type: 'MultiSelectProperty'
      };

      const result = await convertPropertyValue(plugin, propertyConfig, 'client');

      expect(result).toEqual(['client']);
    });

    it('should keep array as-is', async () => {
      const propertyConfig = {
        type: 'MultiSelectProperty'
      };

      const result = await convertPropertyValue(plugin, propertyConfig, ['client', 'expert']);

      expect(result).toEqual(['client', 'expert']);
    });
  });

  describe('Basic property types', () => {
    it('should keep PhoneProperty as-is', async () => {
      const propertyConfig = {
        type: 'PhoneProperty'
      };

      const result = await convertPropertyValue(plugin, propertyConfig, '+33123456789');

      expect(result).toBe('+33123456789');
    });

    it('should keep EmailProperty as-is', async () => {
      const propertyConfig = {
        type: 'EmailProperty'
      };

      const result = await convertPropertyValue(plugin, propertyConfig, 'test@example.com');

      expect(result).toBe('test@example.com');
    });

    it('should keep standard Property as-is', async () => {
      const propertyConfig = {
        type: 'Property'
      };

      const result = await convertPropertyValue(plugin, propertyConfig, 'Some text');

      expect(result).toBe('Some text');
    });
  });

  describe('Edge cases', () => {
    it('should handle null values', async () => {
      const propertyConfig = {
        type: 'Property'
      };

      const result = await convertPropertyValue(plugin, propertyConfig, null);

      expect(result).toBeNull();
    });

    it('should handle undefined values', async () => {
      const propertyConfig = {
        type: 'Property'
      };

      const result = await convertPropertyValue(plugin, propertyConfig, undefined);

      expect(result).toBeUndefined();
    });
  });
});
