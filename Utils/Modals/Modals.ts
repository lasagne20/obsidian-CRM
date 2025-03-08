import { App, FuzzySuggestModal, TFile } from "obsidian";
import { FileSearchModal } from "./FileSearchModal";
import { SelectModal } from "./SelectModal";
import { Classe } from "Classes/Classe";
import { MyVault } from "Utils/MyVault";

export async function selectFile(vault: MyVault, classes: typeof Classe[], title: string): Promise<Classe | undefined>  {
    return new Promise((resolve) => {
        const modal = new FileSearchModal(vault, async (selectedFile: TFile|string, classe: typeof Classe |null) => {
            if (selectedFile instanceof TFile){
                let object = vault.getFromFile(selectedFile)
                resolve(object)
             }
             else if (typeof selectedFile === "string"){
               let file = await vault.createFile(classe, selectedFile+".md")
               console.log(file)
               if (!file){resolve(undefined); return}
               let object = vault.getFromFile(file) 
               resolve(object);
             }
             else {
                resolve(undefined)
             }
        },classes, title);
        modal.open();
    });
}

export async function selectClass(vault : MyVault, title: string) : Promise<typeof Classe| null> {
    return new Promise((resolve) => {
        const modal = new SelectModal(vault.app, (classe) => {
            resolve(classe);
        }, () => {resolve(null)}, MyVault.classes, title);
        modal.open();
    });
}
