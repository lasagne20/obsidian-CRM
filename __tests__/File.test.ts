import AppShim, { TFile } from "../Utils/App";
import { File } from "../Utils/File";

describe('File', () => {
  let app: AppShim;
  let vault: any;
  let file: TFile;
  let fileInstance: File;

  beforeEach(() => {
    app = {
      vault: {
        read: jest.fn(),
        modify: jest.fn(),
        getAbstractFileByPath: jest.fn(),
        rename: jest.fn(),
      },
      metadataCache: {
        getFileCache: jest.fn(),
      },
    } as unknown as AppShim;

    vault = {
      getFromLink: jest.fn(),
    };

    file = {
      path: 'test/path/file.md',
      name: 'file.md',
    } as TFile;

    fileInstance = new File(app, vault, file);
  });

  describe('sortFrontmatter', () => {
    it('should format simple key-value pairs', () => {
      const frontmatter = {
        title: "Test Title",
        description: "Test Description"
      };
      const result = fileInstance.sortFrontmatter(frontmatter, []);
      expect(result.sortedFrontmatter).toBeDefined();
    });

    it('should format arrays', () => {
      const frontmatter = {
        tags: ["tag1", "tag2"]
      };
      const result = fileInstance.sortFrontmatter(frontmatter, []);
      expect(result.sortedFrontmatter).toBeDefined();
    });

    it('should format nested objects', () => {
      const frontmatter = {
        author: {
          name: "John Doe",
          email: "john.doe@example.com"
        }
      };
      const result = fileInstance.formatFrontmatter(frontmatter);
      expect(result).toBe('author:\n  name: John Doe\n  email: john.doe@example.com\n');
    });

    it('should format arrays of objects', () => {
      const frontmatter = {
        contributors: [
          { name: "John Doe", email: "john.doe@example.com" },
          { name: "Jane Doe", email: "jane.doe@example.com" }
        ]
      };
      const result = fileInstance.formatFrontmatter(frontmatter);
      expect(result).toBe(
        'contributors:\n' +
        '  - name: John Doe\n    email: john.doe@example.com\n' +
        '  - name: Jane Doe\n    email: jane.doe@example.com\n'
      );
    });

    it('should handle empty objects', () => {
      const frontmatter = {
        emptyObject: {}
      };
      const result = fileInstance.formatFrontmatter(frontmatter);
      expect(result).toBe('emptyObject: {}\n');
    });

    it('should handle empty arrays', () => {
      const frontmatter = {
        emptyArray: []
      };
      const result = fileInstance.formatFrontmatter(frontmatter);
      expect(result).toBe('emptyArray: []\n');
    });

    it('should format deeply nested objects', () => {
      const frontmatter = {
        level1: {
          level2: {
            level3: {
              key: "value"
            }
          }
        }
      };
      const result = fileInstance.formatFrontmatter(frontmatter);
      expect(result).toBe('level1:\n  level2:\n    level3:\n      key: value\n');
    });
  });
});