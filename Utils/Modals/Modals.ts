import { App, TFile } from "obsidian";
import { FileSearchModal } from "./FileSearchModal";
import { SelectModal } from "./SelectModal";
import { Classe } from "Classes/Classe";
import { MyVault } from "Utils/MyVault";

export async function selectFile(vault: MyVault, classe: typeof Classe, title: string): Promise<Classe> {
    return new Promise((resolve) => {
        const modal = new FileSearchModal(vault, async (selectedFile: TFile|string) => {
            if (selectedFile instanceof TFile){
                let object = vault.getFromFile(selectedFile)
                resolve(object)
             }
             else if (typeof selectedFile === "string"){
               let file = await vault.createFile(classe, selectedFile+".md")
               let object = vault.getFromFile(file)
               resolve(object);
             }
        }, classe, title);
        modal.open();
    });
}

export async function selectClass(vault : MyVault, title: string) : Promise<typeof Classe> {
    return new Promise((resolve) => {
        const modal = new SelectModal(vault.app, (classe) => {
            resolve(classe);
        }, MyVault.classes, title);
        modal.open();
    });
}