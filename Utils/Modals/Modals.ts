import { App, FuzzySuggestModal, TFile } from "obsidian";
import { FileSearchModal } from "./FileSearchModal";
import { SelectModal } from "./SelectModal";
import { Classe } from "Classes/Classe";
import { MyVault } from "Utils/MyVault";
import { MediaSearchModal } from "./MediaSearchModal";
import { SubClass } from "Classes/SubClasses/SubClass";
import { NumericCellType } from "handsontable/cellTypes";
import { SubClassProperty } from "Utils/Properties/SubClassProperty";
import { TextInputModal } from "./TextInputModal";
import { MultiFileSearchModal } from "./MultiFileSearchModal ";

export async function selectFile(vault: MyVault, classes: string[],
        args : {hint?: string, optionnalFilter?: (file: TFile) => boolean, optionnalGetItems? : () => (TFile | string)[], classeArgs?: {}} = {}): Promise<Classe | undefined>  {
    return new Promise((resolve) => {
        const modal = new FileSearchModal(vault, async (selectedFile: TFile|string, classe: typeof Classe |null) => {
            if (selectedFile instanceof TFile){
                let object = vault.getFromFile(selectedFile)
                resolve(object)
             }
             else if (typeof selectedFile === "string"){
               let file = await vault.createFile(classe, selectedFile+".md", args.classeArgs)
               if (!file){resolve(undefined); return}
               let object = vault.getFromFile(file) 
               resolve(object);
             }
             else {
                resolve(undefined)
             }
        },classes.map(name => vault.getClasseFromName(name)), args);
        modal.open();
    });
}

export async function selectMultipleFile(vault: MyVault, classes: string[],
        args : {hint?: string, optionnalFilter?: (file: TFile) => boolean, optionnalGetItems? : () => TFile[]} = {}): Promise<Classe[] | undefined>  {
    return new Promise((resolve) => {
        const modal = new MultiFileSearchModal(vault, async (selectedFiles: TFile[]) => {
            if (selectedFiles.length > 0 && selectedFiles[0] instanceof TFile){
                let objects = selectedFiles.map(file => vault.getFromFile(file)).filter(obj => obj !== undefined);
                resolve(objects)
             }
            
             else {
                resolve(undefined)
             }
        },classes.map(name => vault.getClasseFromName(name)), args);
        modal.open();
    });
}

export async function selectClass(vault: any, title: string, classes : Classe[] | null= null) : Promise<typeof Classe| null> {
    return new Promise((resolve) => {
        const modal = new SelectModal(vault.app, (classe) => {
            resolve(classe);
        }, () => {resolve(null)}, classes ? classes : MyVault.classes, title);
        modal.open();
    });
}

export async function selectSubClasses(vault: any, title: string, subClasses : SubClass[]) : Promise<SubClass| null> {
    return new Promise((resolve) => {
        // Convert subClasses list to a dictionary {name: value}
        const subClassDict = Object.fromEntries(subClasses.map(sc => [sc.getsubClassName(), sc]));
        console.log("Subclasses", subClassDict);
        const modal = new SelectModal(
            vault.app,
            (el) => { resolve(el); },
            () => { resolve(null); },
            subClassDict,
            title
        );
        modal.open();
    });
}

export async function selectMedia(vault: MyVault, title: string, extensions? : string[], pathFolder? : string): Promise<TFile | undefined>  {
    return new Promise((resolve) => {
        const modal = new MediaSearchModal(vault, async (selectedFile: TFile|string) => {
            if (selectedFile instanceof TFile){
                resolve(selectedFile)
             }
             else {
                resolve(undefined)
             }
        }, title, extensions, pathFolder);
        modal.open();
    });
}

export async function promptTextInput(vault: MyVault, title: string): Promise<string | null> {
    return new Promise((resolve) => {
        const modal = new TextInputModal(vault.app,  (input: string | null) => {
            resolve(input);
        }, title);
        modal.open();
    });
}