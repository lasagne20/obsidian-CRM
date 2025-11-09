import { App, TFile } from 'obsidian';
import { FileSearchModal } from './FileSearchModal';

/**
 * Modal to search and select media files (images, PDFs, etc.)
 */
export class MediaSearchModal extends FileSearchModal {
    private extensions: string[] = ['png', 'jpg', 'jpeg', 'pdf', 'svg', 'gif', 'webp'];
    private pathFolder?: string;

    constructor(
        app: App,
        onChoose: (file: TFile | string | null) => void,
        hint: string = "Search for media files",
        extensions?: string[],
        pathFolder?: string
    ) {
        super(app, onChoose, [], { hint });
        this.extensions = extensions || this.extensions;
        this.pathFolder = pathFolder;
    }

    getItems(): (TFile | string)[] {
        const allFiles = this.app.vault.getFiles();
        return allFiles.filter(file => {
            const matchesExtension = file.extension ? this.extensions.includes(file.extension) : false;
            const matchesPath = this.pathFolder ? file.path.startsWith(this.pathFolder) : true;
            return matchesExtension && matchesPath;
        });
    }
}
