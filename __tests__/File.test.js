import { File } from "../Utils/File";
describe('File', () => {
    let app;
    let vault;
    let file;
    let fileInstance;
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
        };
        vault = {
            getFromLink: jest.fn(),
        };
        file = {
            path: 'test/path/file.md',
            name: 'file.md',
        };
        fileInstance = new File(app, vault, file);
    });
    describe('formatFrontmatter', () => {
        it('should format simple key-value pairs', () => {
            const frontmatter = {
                title: "Test Title",
                description: "Test Description"
            };
            const result = fileInstance.formatFrontmatter(frontmatter);
            expect(result).toBe('title: "Test Title"\ndescription: "Test Description"\n');
        });
        it('should format arrays', () => {
            const frontmatter = {
                tags: ["tag1", "tag2"]
            };
            const result = fileInstance.formatFrontmatter(frontmatter);
            expect(result).toBe('tags:\n  - "tag1"\n  - "tag2"\n');
        });
        it('should format nested objects', () => {
            const frontmatter = {
                author: {
                    name: "John Doe",
                    email: "john.doe@example.com"
                }
            };
            const result = fileInstance.formatFrontmatter(frontmatter);
            expect(result).toBe('author:\n  name: "John Doe"\n  email: "john.doe@example.com"\n');
        });
        it('should format arrays of objects', () => {
            const frontmatter = {
                contributors: [
                    { name: "John Doe", email: "john.doe@example.com" },
                    { name: "Jane Doe", email: "jane.doe@example.com" }
                ]
            };
            const result = fileInstance.formatFrontmatter(frontmatter);
            expect(result).toBe('contributors:\n' +
                '  - name: "John Doe"\n    email: "john.doe@example.com"\n' +
                '  - name: "Jane Doe"\n    email: "jane.doe@example.com"\n');
        });
        it('should handle empty objects', () => {
            const frontmatter = {
                emptyObject: {}
            };
            const result = fileInstance.formatFrontmatter(frontmatter);
            expect(result).toBe('emptyObject:\n');
        });
        it('should handle empty arrays', () => {
            const frontmatter = {
                emptyArray: []
            };
            const result = fileInstance.formatFrontmatter(frontmatter);
            expect(result).toBe('emptyArray:\n');
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
            expect(result).toBe('level1:\n  level2:\n    level3:\n      key: "value"\n');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmlsZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRmlsZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFckMsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7SUFDcEIsSUFBSSxHQUFRLENBQUM7SUFDYixJQUFJLEtBQVUsQ0FBQztJQUNmLElBQUksSUFBVyxDQUFDO0lBQ2hCLElBQUksWUFBa0IsQ0FBQztJQUV2QixVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsR0FBRyxHQUFHO1lBQ0osS0FBSyxFQUFFO2dCQUNMLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO2dCQUNmLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO2dCQUNqQixxQkFBcUIsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO2dCQUNoQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTthQUNsQjtZQUNELGFBQWEsRUFBRTtnQkFDYixZQUFZLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTthQUN4QjtTQUNnQixDQUFDO1FBRXBCLEtBQUssR0FBRztZQUNOLFdBQVcsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO1NBQ3ZCLENBQUM7UUFFRixJQUFJLEdBQUc7WUFDTCxJQUFJLEVBQUUsbUJBQW1CO1lBQ3pCLElBQUksRUFBRSxTQUFTO1NBQ1AsQ0FBQztRQUVYLFlBQVksR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUNqQyxFQUFFLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1lBQzlDLE1BQU0sV0FBVyxHQUFHO2dCQUNsQixLQUFLLEVBQUUsWUFBWTtnQkFDbkIsV0FBVyxFQUFFLGtCQUFrQjthQUNo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Q0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBGaWxlIH0gZnJvbSBcIi4uL1V0aWxzL0ZpbGVcIjtcclxuXHJcbmRlc2NyaWJlKCdGaWxlJywgKCkgPT4ge1xyXG4gIGxldCBhcHA6IEFwcDtcclxuICBsZXQgdmF1bHQ6IGFueTtcclxuICBsZXQgZmlsZTogVEZpbGU7XHJcbiAgbGV0IGZpbGVJbnN0YW5jZTogRmlsZTtcclxuXHJcbiAgYmVmb3JlRWFjaCgoKSA9PiB7XHJcbiAgICBhcHAgPSB7XHJcbiAgICAgIHZhdWx0OiB7XHJcbiAgICAgICAgcmVhZDogamVzdC5mbigpLFxyXG4gICAgICAgIG1vZGlmeTogamVzdC5mbigpLFxyXG4gICAgICAgIGdldEFic3RyYWN0RmlsZUJ5UGF0aDogamVzdC5mbigpLFxyXG4gICAgICAgIHJlbmFtZTogamVzdC5mbigpLFxyXG4gICAgICB9LFxyXG4gICAgICBtZXRhZGF0YUNhY2hlOiB7XHJcbiAgICAgICAgZ2V0RmlsZUNhY2hlOiBqZXN0LmZuKCksXHJcbiAgICAgIH0sXHJcbiAgICB9IGFzIHVua25vd24gYXMgQXBwO1xyXG5cclxuICAgIHZhdWx0ID0ge1xyXG4gICAgICBnZXRGcm9tTGluazogamVzdC5mbigpLFxyXG4gICAgfTtcclxuXHJcbiAgICBmaWxlID0ge1xyXG4gICAgICBwYXRoOiAndGVzdC9wYXRoL2ZpbGUubWQnLFxyXG4gICAgICBuYW1lOiAnZmlsZS5tZCcsXHJcbiAgICB9IGFzIFRGaWxlO1xyXG5cclxuICAgIGZpbGVJbnN0YW5jZSA9IG5ldyBGaWxlKGFwcCwgdmF1bHQsIGZpbGUpO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnZm9ybWF0RnJvbnRtYXR0ZXInLCAoKSA9PiB7XHJcbiAgICBpdCgnc2hvdWxkIGZvcm1hdCBzaW1wbGUga2V5LXZhbHVlIHBhaXJzJywgKCkgPT4ge1xyXG4gICAgICBjb25zdCBmcm9udG1hdHRlciA9IHtcclxuICAgICAgICB0aXRsZTogXCJUZXN0IFRpdGxlXCIsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVGVzdCBEZXNjcmlwdGlvblwiXHJcbiAgICAgIH07XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGZpbGVJbnN0YW5jZS5mb3JtYXRGcm9udG1hdHRlcihmcm9udG1hdHRlcik7XHJcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUoJ3RpdGxlOiBcIlRlc3QgVGl0bGVcIlxcbmRlc2NyaXB0aW9uOiBcIlRlc3QgRGVzY3JpcHRpb25cIlxcbicpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBmb3JtYXQgYXJyYXlzJywgKCkgPT4ge1xyXG4gICAgICBjb25zdCBmcm9udG1hdHRlciA9IHtcclxuICAgICAgICB0YWdzOiBbXCJ0YWcxXCIsIFwidGFnMlwiXVxyXG4gICAgICB9O1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBmaWxlSW5zdGFuY2UuZm9ybWF0RnJvbnRtYXR0ZXIoZnJvbnRtYXR0ZXIpO1xyXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKCd0YWdzOlxcbiAgLSBcInRhZzFcIlxcbiAgLSBcInRhZzJcIlxcbicpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBmb3JtYXQgbmVzdGVkIG9iamVjdHMnLCAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGZyb250bWF0dGVyID0ge1xyXG4gICAgICAgIGF1dGhvcjoge1xyXG4gICAgICAgICAgbmFtZTogXCJKb2huIERvZVwiLFxyXG4gICAgICAgICAgZW1haWw6IFwiam9obi5kb2VAZXhhbXBsZS5jb21cIlxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gZmlsZUluc3RhbmNlLmZvcm1hdEZyb250bWF0dGVyKGZyb250bWF0dGVyKTtcclxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZSgnYXV0aG9yOlxcbiAgbmFtZTogXCJKb2huIERvZVwiXFxuICBlbWFpbDogXCJqb2huLmRvZUBleGFtcGxlLmNvbVwiXFxuJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGZvcm1hdCBhcnJheXMgb2Ygb2JqZWN0cycsICgpID0+IHtcclxuICAgICAgY29uc3QgZnJvbnRtYXR0ZXIgPSB7XHJcbiAgICAgICAgY29udHJpYnV0b3JzOiBbXHJcbiAgICAgICAgICB7IG5hbWU6IFwiSm9obiBEb2VcIiwgZW1haWw6IFwiam9obi5kb2VAZXhhbXBsZS5jb21cIiB9LFxyXG4gICAgICAgICAgeyBuYW1lOiBcIkphbmUgRG9lXCIsIGVtYWlsOiBcImphbmUuZG9lQGV4YW1wbGUuY29tXCIgfVxyXG4gICAgICAgIF1cclxuICAgICAgfTtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gZmlsZUluc3RhbmNlLmZvcm1hdEZyb250bWF0dGVyKGZyb250bWF0dGVyKTtcclxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZShcclxuICAgICAgICAnY29udHJpYnV0b3JzOlxcbicgK1xyXG4gICAgICAgICcgIC0gbmFtZTogXCJKb2huIERvZVwiXFxuICAgIGVtYWlsOiBcImpvaG4uZG9lQGV4YW1wbGUuY29tXCJcXG4nICtcclxuICAgICAgICAnICAtIG5hbWU6IFwiSmFuZSBEb2VcIlxcbiAgICBlbWFpbDogXCJqYW5lLmRvZUBleGFtcGxlLmNvbVwiXFxuJ1xyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZW1wdHkgb2JqZWN0cycsICgpID0+IHtcclxuICAgICAgY29uc3QgZnJvbnRtYXR0ZXIgPSB7XHJcbiAgICAgICAgZW1wdHlPYmplY3Q6IHt9XHJcbiAgICAgIH07XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGZpbGVJbnN0YW5jZS5mb3JtYXRGcm9udG1hdHRlcihmcm9udG1hdHRlcik7XHJcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUoJ2VtcHR5T2JqZWN0OlxcbicpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZW1wdHkgYXJyYXlzJywgKCkgPT4ge1xyXG4gICAgICBjb25zdCBmcm9udG1hdHRlciA9IHtcclxuICAgICAgICBlbXB0eUFycmF5OiBbXVxyXG4gICAgICB9O1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBmaWxlSW5zdGFuY2UuZm9ybWF0RnJvbnRtYXR0ZXIoZnJvbnRtYXR0ZXIpO1xyXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKCdlbXB0eUFycmF5OlxcbicpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBmb3JtYXQgZGVlcGx5IG5lc3RlZCBvYmplY3RzJywgKCkgPT4ge1xyXG4gICAgICBjb25zdCBmcm9udG1hdHRlciA9IHtcclxuICAgICAgICBsZXZlbDE6IHtcclxuICAgICAgICAgIGxldmVsMjoge1xyXG4gICAgICAgICAgICBsZXZlbDM6IHtcclxuICAgICAgICAgICAgICBrZXk6IFwidmFsdWVcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBmaWxlSW5zdGFuY2UuZm9ybWF0RnJvbnRtYXR0ZXIoZnJvbnRtYXR0ZXIpO1xyXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKCdsZXZlbDE6XFxuICBsZXZlbDI6XFxuICAgIGxldmVsMzpcXG4gICAgICBrZXk6IFwidmFsdWVcIlxcbicpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn0pOyJdfQ==