import { App, TFile } from 'obsidian';
import { FileSearchModal } from './FileSearchModal';
import { Classe } from 'Classes/Classe';
import { MyVault } from 'Utils/MyVault';

export class MediaSearchModal extends FileSearchModal {
    constructor(vault : MyVault, onChoose: (file: TFile | string | null) => void, hint: string = "") {
        super(vault, onChoose, [], hint);
    }

    getItems(): (TFile | string)[] {
        const mediaExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
        const allFiles = this.app.vault.getFiles();
        return allFiles.filter(file => mediaExtensions.includes(file.extension));
    }
}