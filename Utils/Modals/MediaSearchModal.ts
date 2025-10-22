import { TFile } from '../App';
import { FileSearchModal } from './FileSearchModal';
import { MyVault } from 'Utils/MyVault';

export class MediaSearchModal extends FileSearchModal {

    public extensions: string[] = ['png', 'jpg', 'jpeg', 'pdf', 'sla', 'lbrn2', "svg"];
    public pathFolder?: string;

    constructor(vault : MyVault, onChoose: (file: TFile | string | null) => void, hint: string = "", extensions?: string[], pathFolder?: string) {
        super(vault, onChoose, [], { hint });
        this.extensions = extensions ? extensions : this.extensions;
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