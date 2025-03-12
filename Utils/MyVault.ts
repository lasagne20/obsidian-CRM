import { Institution } from "Classes/Institution";
import { App, MarkdownView, Notice, Setting, TAbstractFile, TFile, TFolder } from "obsidian";
import { File } from "./File";
import { Classe } from "Classes/Classe";
import { Lieu } from "Classes/Lieu";
import { Personne } from "Classes/Personne";
import { FileProperty } from "./Properties/FileProperty";
import { FileSearchModal } from "Utils/Modals/FileSearchModal";
import { SelectModal } from "./Modals/SelectModal";
import { selectClass, selectFile } from "./Modals/Modals";
import { waitForMetaDataCacheUpdate } from "./Utils";
import { Action } from "Classes/Action";
import { Settings } from "./Settings";
import { Partenariat } from "Classes/Partenariat";
import { GeoData } from "./Data/GeoData";
import { SubClass } from "Classes/SubClasses/SubClass";
import { National } from "Classes/SubClasses/Lieux/National";
import { Region } from "Classes/SubClasses/Lieux/Region";
import { Data } from "./Data/Data";
import { Evenement } from "Classes/Evenement";

export class MyVault {
    /*
    Global Vault, with all informations
    */
    public app: App;
    public files: { [key: string]: Classe };
    public settings: Settings;

    public static classes: { [key: string]: any } = {
        [Institution.getClasse()]: Institution,
        [Personne.getClasse()]: Personne,
        [Lieu.getClasse()]: Lieu,
        [Action.getClasse()]: Action,
        [Partenariat.getClasse()]: Partenariat,
        [Evenement.getClasse()]: Evenement
    };

    public static geoData: GeoData;

    constructor(app: App, settings: Settings) {
        this.app = app;
        this.settings = settings;
        this.files = {}; // Contains all classes files for quick search
        MyVault.geoData = new GeoData(app, settings.dataFile,settings.additionalFiles);
    }

    getFileData(classe: Classe): Data | null {
        return MyVault.geoData.getGeoData(classe.getName(false)) ||null;
    }

    getGeoData(locationClass : Classe, locationSubclass: string,  targetClass : string, targetSubclass : string) {
        let geodata : Data[]= MyVault.geoData.getGeoDataList(locationClass.getName(false), locationSubclass, targetSubclass);
        console.log(locationClass)
        console.log("Geodata : ", geodata)
        let existing : Classe[]= locationClass.getChildren().filter(child => {
                    return child.getClasse() === targetClass 
                        && child.getSelectedSubClasse()?.getsubClassName() === targetSubclass})
        console.log("Existing : ", existing)
        if (geodata.length === 0){
            return existing
        }
        let data = geodata.map(data => {
            let exist = existing.find(file => file.getName(false) === data.getName())
            if (exist) {return exist}
            let classe = this.getClasseFromName(targetClass)
            let subClass = classe.subClassesProperty.getSubClassFromName(targetSubclass)
            if (subClass){
                let constructor = subClass.getConstructor()
                let newSubClass = new constructor(classe, data)
                newSubClass.updateParent(this)
                return newSubClass
            }
        }).sort((a, b) => {
            if (a && b) {
                return a.getName(false).localeCompare(b.getName(false));
            }
            return 0;
        })
        console.log("Data : ", data)
        return data.filter((item: Classe | SubClass | undefined): item is Classe | SubClass => item !== undefined);
    }

    getSubClasseFromName(name: string) : [Classe, SubClass]{
        for (let classeName in MyVault.classes) {
            let classe = MyVault.classes[classeName];
            if (classe.subClassesProperty) {
            let subClass = classe.subClassesProperty.getSubClassFromName(name);
            if (subClass) {
                return [classe, subClass];
            }
            }
        }
        throw new Error(`SubClass with name ${name} not found`);
    }

    getClasseFromName(name: string) : typeof Classe{
        return MyVault.classes[name]
    }

    async getGeoParent(classe: Classe): Promise<Classe | undefined> {
        if (!MyVault.geoData) {
            console.error("GeoData is not initialized");
            return;
        }
        const fileName = classe.getName(false);
        try {
            const parentFileName = MyVault.geoData.getParent(fileName);
            if (!parentFileName) {
                return;
            }
            let parentFile = this.app.vault.getFiles().find(f => f.name === `${parentFileName}.md`);
            if (!parentFile) {
                parentFile = await this.createFile(Lieu, parentFileName);
            }
            if (parentFile) {
                return this.getFromFile(parentFile);
            }
        } catch (error) {
            console.error("Error while getting parent from GeoData : " + error);
            return;
        }
    }

    getFromLink(name: string, log=true) {
        const file = this.app.vault.getFiles().find(f => f.name === `${name}.md`);
        if (file) {
            if (file.path in Object.keys(this.files)) {
                return this.files[file.path];
            }
            return this.createClasse(file);
        }
        if (log) {
            console.error("Fichier non trouvé : " + name);
        }
        return null;
    }

    getFromFolder(folder: TFolder) {
        let name = folder.path.split("/")[folder.path.split("/").length - 1];
        for (let file of folder.children) {
            if (file instanceof TFile && file.name.contains(name)) {
                return this.getFromFile(file);
            }
        }
        console.error("Le dossier n'a pas de fichier classe : " + folder.path);
    }

    getFromFile(file: TAbstractFile): Classe | undefined {
        if (file instanceof TFile) {
            let existingClass = this.files[file.path];
            if (existingClass) { return existingClass; }
            let classe = this.createClasse(file);
            if (classe) {
                this.files[file.path] = classe;
            }
            return classe;
        }
        else if (file instanceof TFolder) {
            let filePath = file.path + "/" + file.name + ".md";
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile) {
                return this.getFromFile(existingFile);
            }
        }
    }

    async updateFile(file: TFile) {
        // The file as an update, update it in the classes
        await this.getFromFile(file)?.update();
    }

    async checkFile(file: TFile) {
        // The file as an update, update it in the classes
        await this.getFromFile(file)?.check();
    }

    async createLinkFile(parentFile: TFile, name: string) {
        let parent = this.getFromFile(parentFile);
        let property: any = parent?.findPropertyFromValue(name, true);
        if (property instanceof FileProperty) {
            await this.createFile(this.getClasseFromName(property.classes[0]), name);
            await parent?.update();
        }
    }

    async createFile(classeType: null | typeof Classe = null, name: string = "", ...args: any[]): Promise<TFile | undefined> {
        // Create the new file from the className template
        if (!classeType) {
            classeType = await selectClass(this, "Quelle classe pour se fichier ?");
            if (!classeType) { return; }
        }
        if (!name) {
            let classe = await selectFile(this, [classeType.getClasse()], "Entrer un nom pour ce fichier");
            // Select File call createFile if the file doesn't exist
            // No need to continue
            return classe?.file;
        }
        let templatePath = this.settings.templateFolder + "/" + classeType.getClasse() + ".md";
        const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
        const newFilePath = name.includes(".md") ? name : `${name}.md`;
        let templateContent = "---\nClasse: " + classeType.getClasse() + "\n---\n";

        if (templateFile instanceof TFile) {
            templateContent = await this.app.vault.read(templateFile);
        } else {
            console.warn("Le fichier template n'existe pas :" + templatePath + ". Un fichier vide sera créé.");
        }

        try {
            await this.app.vault.create(newFilePath, templateContent);
            console.log("Nouveau fichier créé : " + newFilePath);
        } catch (error) {
            // Modifier le fichier s'il existe déjà
            let file = this.app.vault.getAbstractFileByPath(newFilePath);
            if (file instanceof TFile) {
            await this.app.vault.modify(file, templateContent);
            console.log("Fichier modifié : " + newFilePath);
            } else {
            throw Error("Le fichier n'a pas pu être créé ou modifié : " + newFilePath);
            }
        }

        let file = this.app.vault.getFiles().find(f => f.name === newFilePath);
        if (!file) {
            throw Error("Le fichier n'existe pas : " + newFilePath);
        }

        await waitForMetaDataCacheUpdate(this.app, async () => {
            if (!file) { return; }
            let classe = this.getFromFile(file);
            await classe?.check();
            await classe?.populate(...args);
        });
        return file;
    }

    async refreshAll() {
        // Move all files 
        let watchedFiles: string[] = [];
        for (let file of this.app.vault.getFiles()) {
            if (watchedFiles.includes(file.name) || file.path.startsWith("Outils")) {
                continue;
            }
            console.log("Refresh : " + file.path);
            await this.getFromFile(file)?.update();
            await this.getFromFile(file)?.check();

            // Remove the duplicates
            for (let file2 of this.app.vault.getFiles()) {
                // Compare the name
                if (file.name === file2.name && file.path != file2.path) {
                    console.error("Doublon de \n" + file.path + "\n" + file2.path);
                    // Keep the first by default
                    await this.app.vault.delete(file2);
                }
            }
            watchedFiles.push(file.name);
        }

        // Remove empty folders 
        for (let folder of this.app.vault.getAllFolders()) {
            if (folder.children.length === 0) {
                await this.app.vault.delete(folder);
            }
        }

        new Notice("Vault refresh");
    }

    createClasse(file: TFile) {
        const metadata = this.app.metadataCache.getFileCache(file)?.frontmatter;
        if (!metadata) {
            console.error("Pas de metadata");
            return;
        }
        let constructor = MyVault.classes[metadata["Classe"]];
        if (constructor) {
            return new constructor(this.app, this, file);
        }
        console.error("Type non connue : " + metadata["Classe"]);
    }
}