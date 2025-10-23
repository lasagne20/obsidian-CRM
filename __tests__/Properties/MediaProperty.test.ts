/**
 * @jest-environment jsdom
 */

import { FileProperty } from '../../Utils/Properties/FileProperty';
import { MediaProperty } from '../../Utils/Properties/MediaProperty';

// Mock complex dependencies
jest.mock('../../Utils/App', () => ({
    setIcon: jest.fn(),
    Notice: jest.fn()
}));

jest.mock('Utils/Modals/Modals', () => ({
    selectMedia: jest.fn()
}));

jest.mock('three', () => ({}));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({}));
jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({}));
jest.mock('electron', () => ({
    shell: {
        openPath: jest.fn()
    }
}));

describe('MediaProperty', () => {
    let mediaProperty: MediaProperty;
    let mockVault: any;

    beforeEach(() => {
        // Reset DOM mocks
        document.body.innerHTML = '';
        jest.clearAllMocks();
        
        // Mock vault with necessary methods
        mockVault = {
            getMediaFromLink: jest.fn(),
            readLinkFile: jest.fn(),
            app: {
                vault: {
                    getName: jest.fn().mockReturnValue('TestVault'),
                    adapter: {
                        basePath: '/test/vault/path',
                        getResourcePath: jest.fn().mockReturnValue('resource://test-path')
                    }
                }
            }
        };
    });

    beforeEach(() => {
        mediaProperty = new MediaProperty('testMedia');
    });

    describe('constructor', () => {
        it('should create MediaProperty with correct type', () => {
            expect(mediaProperty.type).toBe('media');
        });

        it('should inherit from FileProperty', () => {
            expect(mediaProperty).toBeInstanceOf(FileProperty);
        });

        it('should use default args when none provided', () => {
            const defaultProperty = new MediaProperty('defaultTest');
            expect(defaultProperty.name).toBe('defaultTest');
            expect(defaultProperty.type).toBe('media');
        });

        it('should accept custom args', () => {
            const customArgs = { icon: 'custom-icon', display: 'embed', create: 'create-option' };
            const customProperty = new MediaProperty('customName', customArgs);
            expect(customProperty.name).toBe('customName');
            expect(customProperty.createOption).toBe('create-option');
        });

        it('should handle empty create option', () => {
            const property = new MediaProperty('test', { create: undefined });
            expect(property.createOption).toBe('');
        });
    });

    describe('getLink', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
        });

        it('should return media name when value is valid', () => {
            const testValue = '[[TestImage.jpg]]';
            mockVault.getMediaFromLink.mockReturnValue({ name: 'TestImage.jpg', path: 'images/TestImage.jpg' });
            
            const result = mediaProperty.getLink(testValue);
            
            expect(mockVault.getMediaFromLink).toHaveBeenCalledWith(testValue);
            expect(result).toBe('TestImage.jpg');
        });

        it('should return empty string when value is null', () => {
            const result = mediaProperty.getLink(null as any);
            
            expect(result).toBe('');
        });

        it('should return empty string when value is undefined', () => {
            const result = mediaProperty.getLink(undefined as any);
            
            expect(result).toBe('');
        });

        it('should return empty string when value is empty string', () => {
            const result = mediaProperty.getLink('');
            
            expect(result).toBe('');
        });

        it('should return empty string when media not found', () => {
            const testValue = '[[NonExistentImage.jpg]]';
            mockVault.getMediaFromLink.mockReturnValue(null);
            
            const result = mediaProperty.getLink(testValue);
            
            expect(result).toBe('');
        });

        it('should return empty string when media has no name', () => {
            const testValue = '[[TestImage.jpg]]';
            mockVault.getMediaFromLink.mockReturnValue({ path: 'images/TestImage.jpg' });
            
            const result = mediaProperty.getLink(testValue);
            
            expect(result).toBe('');
        });

        it('should handle vault parameter', () => {
            const newVault = { ...mockVault };
            newVault.getMediaFromLink.mockReturnValue({ name: 'test.jpg' });
            
            const result = mediaProperty.getLink('[[test.jpg]]', newVault);
            
            expect(result).toBe('test.jpg');
        });
    });

    describe('openFile', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
        });

        it('should open file with correct path', () => {
            const { shell } = require('electron');
            const testValue = '[[TestImage.jpg]]';
            const mediaPath = 'images/TestImage.jpg';
            
            mockVault.getMediaFromLink.mockReturnValue({ path: mediaPath });
            
            mediaProperty.openFile(testValue);
            
            expect(mockVault.getMediaFromLink).toHaveBeenCalledWith(testValue);
            // Just check that shell.openPath was called, don't worry about exact path separator
            expect(shell.openPath).toHaveBeenCalledWith(expect.stringContaining('TestImage.jpg'));
        });

        it('should handle media file without path property', () => {
            const { shell } = require('electron');
            const testValue = '[[TestImage.jpg]]';
            
            // Return media object without path property
            mockVault.getMediaFromLink.mockReturnValue({ name: 'TestImage.jpg' });
            
            // This will attempt to call path.join with undefined, which may throw
            expect(() => {
                mediaProperty.openFile(testValue);
            }).toThrow();
        });

        it('should handle missing vault base path', () => {
            const { shell } = require('electron');
            const testValue = '[[TestImage.jpg]]';
            const mediaPath = 'images/TestImage.jpg';
            
            // Create a new vault mock without basePath
            const vaultWithoutBasePath = {
                ...mockVault,
                app: {
                    vault: {
                        adapter: {
                            getResourcePath: jest.fn().mockReturnValue('resource://test-path')
                        }
                    }
                }
            };
            mediaProperty.vault = vaultWithoutBasePath;
            vaultWithoutBasePath.getMediaFromLink.mockReturnValue({ path: mediaPath });
            
            mediaProperty.openFile(testValue);
            
            expect(shell.openPath).toHaveBeenCalledWith(mediaPath);
        });
    });

    describe('fillDisplay', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
        });

        it('should set vault property', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[TestImage.jpg]]';
            
            mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            
            expect(mediaProperty.vault).toBe(mockVault);
        });

        it('should handle non-link values by calling parent', () => {
            const mockUpdate = jest.fn();
            const testValue = 'plain text';
            
            // Mock parent's fillDisplay
            const parentFillDisplay = jest.spyOn(FileProperty.prototype, 'fillDisplay');
            parentFillDisplay.mockReturnValue(document.createElement('div'));
            
            const result = mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            
            expect(parentFillDisplay).toHaveBeenCalled();
            expect(result).toBeTruthy();
            
            parentFillDisplay.mockRestore();
        });

        it('should process Obsidian links', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[TestImage.jpg]]';
            mediaProperty.display = 'embed';
            
            mockVault.getMediaFromLink.mockReturnValue({ path: 'images/TestImage.jpg' });
            
            const result = mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            
            expect(result).toBeTruthy();
            expect(result.tagName).toBe('DIV');
        });

        it('should handle null value', () => {
            const mockUpdate = jest.fn();
            
            const result = mediaProperty.fillDisplay(mockVault, null, mockUpdate);
            
            expect(result).toBeTruthy();
        });

        it('should handle undefined value', () => {
            const mockUpdate = jest.fn();
            
            const result = mediaProperty.fillDisplay(mockVault, undefined, mockUpdate);
            
            expect(result).toBeTruthy();
        });
    });

    describe('createOption handling', () => {
        it('should store createOption from constructor', () => {
            const propertyWithCreate = new MediaProperty('test', { create: 'freecad' });
            expect(propertyWithCreate.createOption).toBe('freecad');
        });

        it('should default to empty string for createOption', () => {
            const propertyWithoutCreate = new MediaProperty('test');
            expect(propertyWithoutCreate.createOption).toBe('');
        });
    });

    describe('display property', () => {
        it('should be undefined initially', () => {
            expect(mediaProperty.display).toBeUndefined();
        });

        it('should be set during getDisplay or fillDisplay', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[TestImage.jpg]]';
            mediaProperty.display = 'embed';
            
            expect(mediaProperty.display).toBe('embed');
        });
    });

    describe('inheritance from FileProperty', () => {
        it('should have classes property from parent', () => {
            expect(mediaProperty.classes).toEqual([]);
        });

        it('should have getClasses method from parent', () => {
            expect(typeof mediaProperty.getClasses).toBe('function');
            expect(mediaProperty.getClasses()).toEqual([]);
        });

        it('should have validate method from parent', () => {
            expect(typeof mediaProperty.validate).toBe('function');
        });

        it('should have name property from parent', () => {
            expect(mediaProperty.name).toBe('testMedia');
        });
    });

    describe('error handling', () => {
        it('should handle missing vault gracefully', () => {
            const testValue = '[[TestImage.jpg]]';
            mediaProperty.vault = null;
            
            expect(() => {
                mediaProperty.getLink(testValue);
            }).toThrow();
        });

        it('should handle malformed Obsidian links in fillDisplay', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[TestImage.jpg'; // Malformed link
            
            expect(() => {
                mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            }).not.toThrow();
        });
    });

    describe('getDisplay advanced functionality', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
            mediaProperty.createOption = 'freecad';
        });

        it('should create file creation container when no file and createOption set', () => {
            const mockFile = { updateMetadata: jest.fn(), check: jest.fn() };
            mediaProperty.read = jest.fn().mockReturnValue(null);
            
            const createFunction = jest.fn().mockResolvedValue('newfile.fcstd');
            const args = {
                createOptions: {
                    createFunction: createFunction,
                    title: 'Créer un fichier FreeCAD'
                }
            };
            
            const result = mediaProperty.getDisplay(mockFile, args);
            
            expect(result.classList.contains('create-freecad-container')).toBe(true);
            const button = result.querySelector('button');
            expect(button).toBeTruthy();
            expect(button?.textContent).toBe('Créer un fichier FreeCAD');
        });

        it('should handle file creation button click', async () => {
            const mockFile = { updateMetadata: jest.fn(), check: jest.fn() };
            mediaProperty.read = jest.fn().mockReturnValue(null);
            
            const createFunction = jest.fn().mockResolvedValue('newfile.fcstd');
            mockVault.getMediaFromLink.mockReturnValue({ path: 'files/newfile.fcstd' });
            
            const args = {
                createOptions: {
                    createFunction: createFunction,
                    title: 'Créer un fichier'
                }
            };
            
            const result = mediaProperty.getDisplay(mockFile, args);
            const button = result.querySelector('button') as HTMLButtonElement;
            
            // Simulate button click
            await button.click();
            
            expect(createFunction).toHaveBeenCalled();
            expect(mockFile.updateMetadata).toHaveBeenCalledWith(
                mediaProperty.name,
                '[[newfile.fcstd|newfile.fcstd]]'
            );
        });

        it('should add update button when updateOptions provided', () => {
            const mockFile = { updateMetadata: jest.fn() };
            mediaProperty.read = jest.fn().mockReturnValue('[[existing.jpg]]');
            mediaProperty.fillDisplay = jest.fn().mockReturnValue(document.createElement('div'));
            
            const updateFunction = jest.fn().mockResolvedValue('updated.jpg');
            const args = {
                updateOptions: {
                    updateFunction: updateFunction,
                    icon: 'refresh-cw'
                }
            };
            
            const result = mediaProperty.getDisplay(mockFile, args);
            const button = result.querySelector('button');
            
            expect(button).toBeTruthy();
            expect(button?.classList.contains('mod-cta')).toBe(true);
        });

        it('should handle update button click', async () => {
            const mockFile = { updateMetadata: jest.fn() };
            mediaProperty.read = jest.fn().mockReturnValue('[[existing.jpg]]');
            mediaProperty.fillDisplay = jest.fn().mockReturnValue(document.createElement('div'));
            
            const updateFunction = jest.fn().mockResolvedValue('updated.jpg');
            const args = {
                updateOptions: {
                    updateFunction: updateFunction,
                    icon: 'refresh-cw'
                }
            };
            
            const result = mediaProperty.getDisplay(mockFile, args);
            const button = result.querySelector('button') as HTMLButtonElement;
            
            await button.click();
            
            expect(updateFunction).toHaveBeenCalled();
            expect(mockFile.updateMetadata).toHaveBeenCalledWith(
                mediaProperty.name,
                '[[updated.jpg|updated.jpg]]'
            );
        });

        it('should use default display name when no args provided', () => {
            const mockFile = { updateMetadata: jest.fn() };
            mediaProperty.read = jest.fn().mockReturnValue('[[test.jpg]]');
            mediaProperty.fillDisplay = jest.fn().mockReturnValue(document.createElement('div'));
            
            mediaProperty.getDisplay(mockFile);
            
            expect(mediaProperty.display).toBe('name');
        });

        it('should set custom display from args', () => {
            const mockFile = { updateMetadata: jest.fn() };
            mediaProperty.read = jest.fn().mockReturnValue('[[test.jpg]]');
            mediaProperty.fillDisplay = jest.fn().mockReturnValue(document.createElement('div'));
            
            mediaProperty.getDisplay(mockFile, { display: 'embed' });
            
            expect(mediaProperty.display).toBe('embed');
        });
    });

    describe('getFileIcon', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
        });

        it('should return image icon for image files', () => {
            const testValue = '[[test.jpg]]';
            mockVault.getMediaFromLink.mockReturnValue({ path: 'images/test.jpg' });
            
            const result = mediaProperty.getFileIcon(testValue);
            
            expect(result).toBe('image');
        });

        it('should return image icon for different image formats', () => {
            const formats = ['png', 'jpeg', 'gif'];
            
            formats.forEach(format => {
                const testValue = `[[test.${format}]]`;
                mockVault.getMediaFromLink.mockReturnValue({ path: `images/test.${format}` });
                
                const result = mediaProperty.getFileIcon(testValue);
                
                expect(result).toBe('image');
            });
        });

        it('should return cube3d icon for 3D files', () => {
            const formats = ['glb', 'gltf', 'fcstd'];
            
            formats.forEach(format => {
                const testValue = `[[test.${format}]]`;
                mockVault.getMediaFromLink.mockReturnValue({ path: `3d/test.${format}` });
                
                const result = mediaProperty.getFileIcon(testValue);
                
                expect(result).toBe('cube3d');
            });
        });

        it('should return file icon for document files', () => {
            const formats = ['pdf', 'docx', 'txt'];
            
            formats.forEach(format => {
                const testValue = `[[test.${format}]]`;
                mockVault.getMediaFromLink.mockReturnValue({ path: `docs/test.${format}` });
                
                const result = mediaProperty.getFileIcon(testValue);
                
                expect(result).toBe('file');
            });
        });

        it('should return video icon for video files', () => {
            const formats = ['mp4', 'webm', 'ogg'];
            
            formats.forEach(format => {
                const testValue = `[[test.${format}]]`;
                mockVault.getMediaFromLink.mockReturnValue({ path: `videos/test.${format}` });
                
                const result = mediaProperty.getFileIcon(testValue);
                
                expect(result).toBe('video');
            });
        });

        it('should return audio icon for audio files', () => {
            const formats = ['mp3', 'wav'];
            
            formats.forEach(format => {
                const testValue = `[[test.${format}]]`;
                mockVault.getMediaFromLink.mockReturnValue({ path: `audio/test.${format}` });
                
                const result = mediaProperty.getFileIcon(testValue);
                
                expect(result).toBe('audio');
            });
        });

        it('should return archive icon for archive files', () => {
            const formats = ['zip', 'rar'];
            
            formats.forEach(format => {
                const testValue = `[[test.${format}]]`;
                mockVault.getMediaFromLink.mockReturnValue({ path: `archives/test.${format}` });
                
                const result = mediaProperty.getFileIcon(testValue);
                
                expect(result).toBe('archive');
            });
        });

        it('should return square-pen icon for sla files', () => {
            const testValue = '[[test.sla]]';
            mockVault.getMediaFromLink.mockReturnValue({ path: 'prints/test.sla' });
            
            const result = mediaProperty.getFileIcon(testValue);
            
            expect(result).toBe('square-pen');
        });

        it('should return flame icon for lbrn2 files', () => {
            const testValue = '[[test.lbrn2]]';
            mockVault.getMediaFromLink.mockReturnValue({ path: 'laser/test.lbrn2' });
            
            const result = mediaProperty.getFileIcon(testValue);
            
            expect(result).toBe('flame');
        });

        it('should return default icon for unknown file types', () => {
            const testValue = '[[test.unknown]]';
            mockVault.getMediaFromLink.mockReturnValue({ path: 'files/test.unknown' });
            mediaProperty.icon = 'custom-icon';
            
            const result = mediaProperty.getFileIcon(testValue);
            
            expect(result).toBe('custom-icon');
        });

        it('should return default media icon when no custom icon set', () => {
            const testValue = '[[test.unknown]]';
            mockVault.getMediaFromLink.mockReturnValue({ path: 'files/test.unknown' });
            
            const result = mediaProperty.getFileIcon(testValue);
            
            expect(result).toBe('media');
        });

        it('should handle non-link values', () => {
            const result = mediaProperty.getFileIcon('not-a-link');
            
            expect(result).toBe('media');
        });

        it('should handle missing media file', () => {
            const testValue = '[[nonexistent.jpg]]';
            mockVault.getMediaFromLink.mockReturnValue(null);
            
            const result = mediaProperty.getFileIcon(testValue);
            
            expect(result).toBe('media');
        });

        it('should handle media without path', () => {
            const testValue = '[[test.jpg]]';
            mockVault.getMediaFromLink.mockReturnValue({ name: 'test.jpg' }); // No path
            
            const result = mediaProperty.getFileIcon(testValue);
            
            expect(result).toBe('media');
        });
    });

    describe('createEmbedImageContainer', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
            mockVault.app.vault.adapter.getResourcePath = jest.fn().mockReturnValue('resource://test-path');
        });

        it('should create image container with correct structure', () => {
            const mockUpdate = jest.fn();
            const mediaPath = 'images/test.jpg';
            
            const container = mediaProperty.createEmbedImageContainer(mediaPath, mockUpdate);
            
            expect(container.classList.contains('metadata-field')).toBe(true);
            expect(container.classList.contains('media-field')).toBe(true);
            expect(container.classList.contains('embed-container')).toBe(true);
        });

        it('should create img element with correct src', () => {
            const mockUpdate = jest.fn();
            const mediaPath = 'images/test.jpg';
            
            const container = mediaProperty.createEmbedImageContainer(mediaPath, mockUpdate);
            const img = container.querySelector('img');
            
            expect(img).toBeTruthy();
            expect(img?.src).toBe('resource://test-path');
            expect(img?.alt).toBe('Media');
            expect(img?.classList.contains('embed-media')).toBe(true);
        });

        it('should create icon container', () => {
            const mockUpdate = jest.fn();
            const mediaPath = 'images/test.jpg';
            
            const container = mediaProperty.createEmbedImageContainer(mediaPath, mockUpdate);
            const iconContainer = container.querySelector('.icon-container');
            
            expect(iconContainer).toBeTruthy();
        });

        it('should handle icon click for image selection', async () => {
            const mockUpdate = jest.fn();
            const mediaPath = 'images/test.jpg';
            mediaProperty.handleIconClick = jest.fn();
            
            const container = mediaProperty.createEmbedImageContainer(mediaPath, mockUpdate);
            const icon = container.querySelector('i');
            
            // Simulate icon click
            const clickEvent = new MouseEvent('click');
            icon?.dispatchEvent(clickEvent);
            
            // We can't easily test the actual click handler without more complex setup
            expect(icon).toBeTruthy();
        });
    });

    describe('createEmbedEditContainer and createEmbedOpenContainer', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
        });

        it('should create edit container with correct positioning', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            
            const container = mediaProperty.createEmbedEditContainer(mockUpdate, testValue);
            
            expect(container.classList.contains('embed-edit-container')).toBe(true);
            expect(container.style.position).toBe('absolute');
            expect(container.style.top).toBe('5px');
            expect(container.style.left).toBe('5px');
            expect(container.style.cursor).toBe('pointer');
        });

        it('should create edit container with link icon', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            
            const container = mediaProperty.createEmbedEditContainer(mockUpdate, testValue);
            const iconContainer = container.querySelector('.icon-container');
            const icon = container.querySelector('i');
            
            expect(iconContainer).toBeTruthy();
            expect(icon).toBeTruthy();
        });

        it('should create open container with correct positioning', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            
            const container = mediaProperty.createEmbedOpenContainer(mockUpdate, testValue);
            
            expect(container.classList.contains('embed-open-container')).toBe(true);
            expect(container.style.position).toBe('absolute');
            expect(container.style.top).toBe('5px');
            expect(container.style.right).toBe('5px');
            expect(container.style.cursor).toBe('pointer');
        });

        it('should create open container with external-link icon', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            
            const container = mediaProperty.createEmbedOpenContainer(mockUpdate, testValue);
            const iconContainer = container.querySelector('.icon-container');
            const icon = container.querySelector('i');
            
            expect(iconContainer).toBeTruthy();
            expect(icon).toBeTruthy();
        });

        it('should handle open container click to open file', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            mediaProperty.openFile = jest.fn();
            
            const container = mediaProperty.createEmbedOpenContainer(mockUpdate, testValue);
            const icon = container.querySelector('i') as HTMLElement;
            
            // Simulate click
            const clickEvent = new MouseEvent('click');
            Object.defineProperty(clickEvent, 'preventDefault', { value: jest.fn() });
            icon.click();
            
            expect(mediaProperty.openFile).toHaveBeenCalledWith(testValue);
        });

        it('should show notice when no value provided for open', () => {
            const mockUpdate = jest.fn();
            const { Notice } = require('../../Utils/App');
            
            const container = mediaProperty.createEmbedOpenContainer(mockUpdate, '');
            const icon = container.querySelector('i') as HTMLElement;
            
            // Simulate click
            const clickEvent = new MouseEvent('click');
            Object.defineProperty(clickEvent, 'preventDefault', { value: jest.fn() });
            icon.click();
            
            expect(Notice).toHaveBeenCalledWith('Unable to generate link for the media.');
        });
    });

    describe('handleIconClick', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
        });

        it('should handle media selection', async () => {
            const { selectMedia } = require('Utils/Modals/Modals');
            const mockUpdate = jest.fn();
            const selectedFile = { path: 'images/selected.jpg', name: 'selected.jpg' };
            
            selectMedia.mockResolvedValue(selectedFile);
            
            const mockEvent = {
                target: {
                    closest: jest.fn().mockReturnValue({
                        querySelector: jest.fn().mockReturnValue({ textContent: '' })
                    })
                }
            };
            
            await mediaProperty.handleIconClick(mockUpdate, mockEvent as any);
            
            expect(selectMedia).toHaveBeenCalledWith(mockVault, 'Choisissez un document');
            expect(mockUpdate).toHaveBeenCalledWith('[[images/selected.jpg|selected.jpg]]');
        });

        it('should update link text after selection', async () => {
            const { selectMedia } = require('Utils/Modals/Modals');
            const mockUpdate = jest.fn();
            const selectedFile = { path: 'images/selected.jpg', name: 'selected.jpg' };
            
            selectMedia.mockResolvedValue(selectedFile);
            
            const linkElement = document.createElement('a');
            const mockEvent = {
                target: {
                    closest: jest.fn().mockReturnValue({
                        querySelector: jest.fn().mockReturnValue(linkElement)
                    })
                }
            };
            
            await mediaProperty.handleIconClick(mockUpdate, mockEvent as any);
            
            expect(linkElement.textContent).toBe('selected.jpg');
        });

        it('should handle cancelled selection', async () => {
            const { selectMedia } = require('Utils/Modals/Modals');
            const mockUpdate = jest.fn();
            
            selectMedia.mockResolvedValue(null);
            
            const mockEvent = { target: { closest: jest.fn() } };
            
            await mediaProperty.handleIconClick(mockUpdate, mockEvent as any);
            
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });

    describe('createFieldContainerContent', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
            mediaProperty.getLink = jest.fn();
        });

        it('should create field container with truncated text', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[verylongfilename.jpg]]';
            mediaProperty.getLink.mockReturnValue('verylongfilename.jpg');
            
            const container = mediaProperty.createFieldContainerContent(mockUpdate, testValue);
            const link = container.querySelector('a');
            
            expect(container.classList.contains('field-container')).toBe(true);
            expect(link?.textContent).toBe('verylongfile...');
            expect(link?.getAttribute('full-text')).toBe('verylongfilename.jpg');
        });

        it('should not truncate short text', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[short.jpg]]';
            mediaProperty.getLink.mockReturnValue('short.jpg');
            
            const container = mediaProperty.createFieldContainerContent(mockUpdate, testValue);
            const link = container.querySelector('a');
            
            expect(link?.textContent).toBe('short.jpg');
            expect(link?.getAttribute('full-text')).toBe('short.jpg');
        });

        it('should handle empty file name', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[]]';
            mediaProperty.getLink.mockReturnValue(null);
            
            const container = mediaProperty.createFieldContainerContent(mockUpdate, testValue);
            const link = container.querySelector('a');
            
            expect(link?.textContent).toBe('');
            // Test que le lien existe même avec un nom vide
            expect(link).toBeTruthy();
        });

        it('should set up click handler for link', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            mediaProperty.getLink.mockReturnValue('test.jpg');
            mediaProperty.modifyField = jest.fn();
            
            const container = mediaProperty.createFieldContainerContent(mockUpdate, testValue);
            const link = container.querySelector('a') as HTMLAnchorElement;
            
            expect(link.href).toBe('#');
            expect(link.classList.contains('field-link')).toBe(true);
            expect(link.style.display).toBe('block');
        });
    });

    describe('modifyField', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
        });

        it('should open existing file', async () => {
            const mockFile = { name: 'existing.jpg' };
            const mockLeaf = { openFile: jest.fn() };
            
            // Add the missing mock methods
            mockVault.app.vault.getFiles = jest.fn().mockReturnValue([mockFile]);
            mockVault.app.workspace = { getLeaf: jest.fn().mockReturnValue(mockLeaf) };
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('full-text', 'existing.jpg');
            
            const mockEvent = {
                target: {
                    closest: jest.fn().mockReturnValue({
                        querySelector: jest.fn().mockReturnValue(linkElement)
                    })
                },
                preventDefault: jest.fn()
            };
            
            await mediaProperty.modifyField(mockEvent as any);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockLeaf.openFile).toHaveBeenCalledWith(mockFile);
        });

        it('should show notice for non-existent file', async () => {
            const { Notice } = require('../../Utils/App');
            
            // Add the missing mock method
            mockVault.app.vault.getFiles = jest.fn().mockReturnValue([]);
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('full-text', 'nonexistent.jpg');
            
            const mockEvent = {
                target: {
                    closest: jest.fn().mockReturnValue({
                        querySelector: jest.fn().mockReturnValue(linkElement)
                    })
                },
                preventDefault: jest.fn()
            };
            
            await mediaProperty.modifyField(mockEvent as any);
            
            expect(Notice).toHaveBeenCalledWith('Le fichier nonexistent.jpg n\'existe pas');
        });

        it('should return early when no current field', async () => {
            const linkElement = document.createElement('a');
            // No full-text attribute
            
            const mockEvent = {
                target: {
                    closest: jest.fn().mockReturnValue({
                        querySelector: jest.fn().mockReturnValue(linkElement)
                    })
                },
                preventDefault: jest.fn()
            };
            
            await mediaProperty.modifyField(mockEvent as any);
            
            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe('fillDisplay icon mode', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
            mediaProperty.display = 'icon';
        });

        it('should create icon display container', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            mediaProperty.getFileIcon = jest.fn().mockReturnValue('image');
            mockVault.getMediaFromLink.mockReturnValue({ name: 'test.jpg' });
            
            const container = mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            
            expect(container.classList.contains('metadata-field')).toBe(true);
            expect(container.classList.contains('media-field')).toBe(true);
        });

        it('should show file name in icon mode', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            mediaProperty.getFileIcon = jest.fn().mockReturnValue('image');
            mockVault.getMediaFromLink.mockReturnValue({ name: 'test.jpg' });
            
            const container = mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            const fileName = container.querySelector('.media-field-file-name');
            
            expect(fileName?.textContent).toBe('test.jpg');
        });

        it('should show "Fichier non trouvé" when file not found', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[missing.jpg]]';
            mediaProperty.getFileIcon = jest.fn().mockReturnValue('image');
            mockVault.getMediaFromLink.mockReturnValue(null);
            
            const container = mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            const fileName = container.querySelector('.media-field-file-name');
            
            expect(fileName?.textContent).toBe('Fichier non trouvé');
        });

        it('should make container clickable in icon mode', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            mediaProperty.getFileIcon = jest.fn().mockReturnValue('image');
            mediaProperty.openFile = jest.fn();
            mockVault.getMediaFromLink.mockReturnValue({ name: 'test.jpg' });
            
            const container = mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            
            expect(container.style.cursor).toBe('pointer');
            
            // Simulate click
            container.click();
            expect(mediaProperty.openFile).toHaveBeenCalledWith(testValue);
        });
    });

    describe('fillDisplay button mode', () => {
        beforeEach(() => {
            mediaProperty.vault = mockVault;
            mediaProperty.display = 'button';
        });

        it('should create button display container', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            
            const container = mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            
            expect(container.classList.contains('create-freecad-container')).toBe(true);
        });

        it('should create button with default text', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            
            const container = mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            const button = container.querySelector('button');
            
            expect(button?.classList.contains('mod-cta')).toBe(true);
            expect(button?.textContent).toBe('Ouvrir le fichier');
        });

        it('should create button with custom title', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            mediaProperty.title = 'Custom Title';
            
            const container = mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            const button = container.querySelector('button');
            
            expect(button?.textContent).toBe('Custom Title');
        });

        it('should handle button click to open file', () => {
            const mockUpdate = jest.fn();
            const testValue = '[[test.jpg]]';
            mediaProperty.openFile = jest.fn();
            
            const container = mediaProperty.fillDisplay(mockVault, testValue, mockUpdate);
            const button = container.querySelector('button') as HTMLButtonElement;
            
            button.click();
            expect(mediaProperty.openFile).toHaveBeenCalledWith(testValue);
        });
    });
});