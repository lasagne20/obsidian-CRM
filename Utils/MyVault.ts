import AppShim, { TAbstractFile, TFile, TFolder, isTFile, isTFolder, Notice } from "./App";
import { File } from "./File";
import { Classe } from "Classes/Classe";
import { VaultClassAdapter } from "./VaultClassAdapter";
import { FileProperty } from "./Properties/FileProperty";
import { FileSearchModal } from "Utils/Modals/FileSearchModal";
import { SelectModal } from "./Modals/SelectModal";
import { selectClass, selectFile } from "./Modals/Modals";
import { waitForFileMetaDataUpdate } from "./Utils";
import { Settings } from "./Settings";
import { GeoData } from "./Data/GeoData";
import { SubClass } from "Classes/SubClasses/SubClass";
import { Data } from "./Data/Data";
import { FreecadFile } from "./3D/FreecadFile";
import { DynamicClassFactory } from "./Config/DynamicClassFactory";

export class MyVault {
    /*
    Global Vault, with all informations
    */
    public app: AppShim;
    public files: { [key: string]: Classe };
    public dataFiles: { [key: string]: FreecadFile } = {};
    public settings: Settings;

    public static classes: { [key: string]: any } = {};
    private static dynamicClassFactory: DynamicClassFactory | null = null;


    public static geoData: GeoData;
    private classAdapter: VaultClassAdapter | null = null;

    constructor(app: AppShim, settings: Settings) {
        this.app = app;
        this.settings = settings;
        this.files = {}; // Contains all classes files for quick search
        if (settings.dataFile){
            MyVault.geoData = new GeoData(app, settings.dataFile,settings.additionalFiles);
        }
        
        // Initialize the dynamic class adapter if config path is available
        if (settings.configPath) {
            this.classAdapter = new VaultClassAdapter(this, settings.configPath);
        }
        
        // Initialize the dynamic class factory
        this.initializeDynamicClasses();
    }

    private async initializeDynamicClasses() {
        try {
            const configPath = this.settings.configPath || './config';
            MyVault.dynamicClassFactory = DynamicClassFactory.getInstance(configPath, this.app);
            
            // Load available classes and populate the static classes object
            const availableClasses = await MyVault.dynamicClassFactory.getAvailableClasses();
            for (const className of availableClasses) {
                const DynamicClass = await MyVault.dynamicClassFactory.getClass(className);
                MyVault.classes[className] = DynamicClass;
            }
        } catch (error) {
            console.error('Failed to initialize dynamic classes:', error);
        }
    }

    async getDynamicClass(className: string): Promise<typeof Classe | null> {
        try {
            if (!MyVault.dynamicClassFactory) {
                const configPath = this.settings.configPath || './config';
                MyVault.dynamicClassFactory = DynamicClassFactory.getInstance(configPath, this.app);
            }
            return await MyVault.dynamicClassFactory.getClass(className);
        } catch (error) {
            console.error(`Failed to get dynamic class ${className}:`, error);
            return null;
        }
    }

    getPersonalName(){
        return this.settings.personalName
    }

    getFileData(classe: Classe, name?: string): Data | null | FreecadFile {
        if (name){
            if (name in this.dataFiles) {
                this.dataFiles[name].checkUpdate();
                return this.dataFiles[name];
            }
    

        }
        if (!MyVault.geoData) {
            return null;
        }
        return MyVault.geoData.getGeoData(classe.getName(false)) ||null;
    }

    async getAsyncFileData(classe: Classe, name?: string): Promise<Data | null | FreecadFile> {
        if (name){
            let file = this.getMediaFromLink(name);
            if (!file) {
                console.error("Fichier non trouvé : " + name);
                return null;
            }
            if (file.extension?.toLowerCase() === "fcstd") {
                let freecadFile = new FreecadFile(this, file);
                await freecadFile.generateJsonData()
                this.dataFiles[name] = freecadFile;
                return freecadFile;
            }

        }
        return this.getFileData(classe);
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
            let exist = existing.find(file => file.getName(false) === data.name)
            if (exist) {return exist}
            let classe = this.getClasseFromName(targetClass)
            let subClass = classe.subClassesProperty.getSubClassFromName(targetSubclass)
            if (subClass){
                let newSubClass = new subClass(classe, data)
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

    getSubClasseFromName(name: string) : [typeof Classe, typeof SubClass]{
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

    getGeoDataFromName(name: string) {
        if (!MyVault.geoData) {
            console.error("GeoData is not initialized");
            return;
        }
        return MyVault.geoData.getGeoData(name);
    }

    getClasseFromName(name: string) : typeof Classe{
        return MyVault.classes[name]
    }

    /**
     * Get dynamic class from name (async version)
     */
    async getDynamicClasseFromName(name: string): Promise<typeof Classe | null> {
        if (this.classAdapter) {
            try {
                return await this.classAdapter.getClass(name);
            } catch (error) {
                console.error(`Failed to get dynamic class ${name}:`, error);
            }
        }
        // Fallback to legacy system
        return this.getClasseFromName(name) || null;
    }

    /**
     * Get all available class names (including dynamic ones)
     */
    async getAllClassNames(): Promise<string[]> {
        if (this.classAdapter) {
            try {
                return await this.classAdapter.getAvailableClasses();
            } catch (error) {
                console.error('Failed to get dynamic class names:', error);
            }
        }
        // Fallback to legacy system
        return Object.keys(MyVault.classes);
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
                // Use dynamic class system to create Lieu
                const LieuClass = await this.getDynamicClass('Lieu');
                if (LieuClass) {
                    parentFile = await this.createFile(LieuClass as any, parentFileName);
                }
            }
            if (parentFile) {
                return this.getFromFile(parentFile);
            }
        } catch (error) {
            console.error("Error while getting parent from GeoData : " + error);
            return;
        }
    }

    readLinkFile(link: string, path = false): string {
        if (!link || typeof link !== "string") return "";
        // Match [[file|alias]] or [[file]]
        const match = link.match(/^\[\[([^\|\]]+?)(?:)?(?:\|([^\]]+))?\]\]$/);
        if (match) {
            const fileName = match[1]?.trim();
            const alias = match[2]?.trim();
            if (path) {
                return /\.[^\/\\]+$/.test(fileName) ? fileName : `${fileName}.md`;
            } else {
                return alias ? alias : fileName.split("/").pop()?.replace(".md","") || "";
            }
        }
        // If not a wikilink, just return the trimmed link
        return link.trim();
    }

    getFromLink(name: string, log=true) {
        if (!name) { return null; }

        // Search with the path
        let path = this.readLinkFile(name, true);
        let directfile = this.app.vault.getFiles().find(f => {
            return f.path.trim() === path.trim()});
        if (directfile) {
            if (directfile.path in Object.keys(this.files)) {
                return this.files[directfile.path];
            }
            return this.createClasse(directfile);
        }


        let fileName = path.split("/").pop() || "";
        const files = this.app.vault.getFiles().filter(f => f.name === fileName);
        if (files.length > 0) {
            let file = files[0];
            if (files.length > 1) {
                let path = this.readLinkFile(name, true);
                if (path) {
                    // Try to find the best match by walking up the path segments
                    let segments = path.split("/");
                    while (segments.length > 0) {
                        const candidatePath = segments.join("/");
                        const bestMatch = files.find(f => f.path.endsWith("/" + candidatePath) || f.path === candidatePath);
                        if (bestMatch) {
                            file = bestMatch;
                            break;
                        }
                        segments.shift(); // Remove the first segment and try again
                    }
                }
                else {
                    console.error("Plusieurs fichiers trouvés pour le lien sans chemin : " + name, files);
                }
            }

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

    getMediaFromLink(link: string) {
        let path = this.readLinkFile(link, true);
        const file = this.app.vault.getFiles().find(f => {
            return f.path === path});
        if (file) {
            return file;
        }

        // try with the file name
        let fileName = this.readLinkFile(link);
        const files = this.app.vault.getFiles().filter(f => f.name === fileName);
        if (files.length > 0) {
            let file = files[0];
            if (files.length > 1) {
                console.error("Plusieurs fichiers trouvés pour le lien sans chemin : " + link, files);
            }
            return file;
        }

        console.error("Media non trouvé : " + link);
        return null;
    }

    getFromFolder(folder: TFolder) {
        let name = folder.path.split("/")[folder.path.split("/").length - 1];
        for (let file of folder.children || []) {
            if (isTFile(file) && file.name.includes(name)) {
                return this.getFromFile(file);
            }
        }
        console.error("Le dossier n'a pas de fichier classe : " + folder.path);
    }

    getFromFile(file: TAbstractFile): Classe | undefined {
        if (isTFile(file)) {
            let existingClass = this.files[file.path];
            if (existingClass) { return existingClass; }
            
            let classe: Classe | undefined;
            
            // Try new dynamic system first if available
            if (this.classAdapter) {
                try {
                    // Note: This is async but we need sync. In practice, we'd need to refactor this method
                    // For now, fall back to the old system
                    classe = this.createClasse(file);
                } catch (error) {
                    console.error('Dynamic class creation failed, falling back to legacy:', error);
                    classe = this.createClasse(file);
                }
            } else {
                classe = this.createClasse(file);
            }
            
            if (classe) {
                this.files[file.path] = classe;
            }
            return classe;
        }
        else if (isTFolder(file)) {
            let filePath = file.path + "/" + file.name + ".md";
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile) {
                return this.getFromFile(existingFile);
            }
        }
    }

    /**
     * Async version of getFromFile that supports dynamic classes
     */
    async getFromFileAsync(file: TFile): Promise<Classe | null> {
        let existingClass = this.files[file.path];
        if (existingClass) { return existingClass; }
        
        let classe: Classe | null = null;
        
        // Try new dynamic system first if available
        if (this.classAdapter) {
            try {
                classe = await this.classAdapter.getFromFile(file);
            } catch (error) {
                console.error('Dynamic class creation failed, falling back to legacy:', error);
                classe = this.createClasse(file) || null;
            }
        } else {
            classe = this.createClasse(file) || null;
        }
        
        if (classe) {
            this.files[file.path] = classe;
        }
        return classe;
    }

    async updateFile(file: TFile) {
        // The file as an update, update it in the classes
        const classe = this.getFromFile(file);
        if (classe && typeof classe.update === 'function') {
            await classe.update();
        }
    }

    async checkFile(file: TFile) {
        // The file as an update, update it in the classes
        const classe = this.getFromFile(file);
        if (classe && typeof classe.check === 'function') {
            await classe.check();
        }
    }

    async createLinkFile(parentFile: TFile, name: string) {
        let parent = this.getFromFile(parentFile);
        let property: any = parent?.findPropertyFromValue(name, true);
        if (property instanceof FileProperty) {
            await this.createFile(this.getClasseFromName(property.classes[0]), name);
            if (parent && typeof parent.update === 'function') {
                await parent.update();
            }
        }
    }

    async createFile(classeType: null | typeof Classe = null, name: string = "", args: {parent? : Classe} = {}): Promise<TFile | undefined> {
        // Create the new file from the className template
        if (!classeType) {
            classeType = await selectClass(this, "Quelle classe pour se fichier ?");
            if (!classeType) { return; }
        }
        console.log("Args ; ",args)
        if (!name) {
            let classe = await selectFile(this, [classeType.getClasse()], {hint:"Entrer un nom pour ce fichier", classeArgs: args});
            // Select File call createFile if the file doesn't exist
            // No need to continue
            return classe?.file;
        }
        let templatePath = this.settings.templateFolder + "/" + classeType.getClasse() + ".md";
        const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
        const newFilePath = name.includes(".md") ? name : `${name}.md`;
        let templateContent = "---\nClasse: " + classeType.getClasse() + "\n---\n";

        if (templateFile && isTFile(templateFile)) {
            templateContent = await this.app.vault.read(templateFile);
        } else {
            console.warn("Le fichier template n'existe pas :" + templatePath + ". Un fichier vide sera créé.");
        }
        let file: TFile | null = null;
        try {
            file = await this.app.vault.create(newFilePath, templateContent);
            console.log("Nouveau fichier créé : " + newFilePath);
        } catch (error) {
            // Modifier le fichier s'il existe déjà
            const abstractFile = this.app.vault.getAbstractFileByPath(newFilePath);
            file = isTFile(abstractFile) ? abstractFile : null;
            if (file && isTFile(file)) {
                await this.app.vault.modify(file, templateContent);
                console.log("Fichier modifié : " + newFilePath);
            } else {
                throw Error("Le fichier n'a pas pu être créé ou modifié : " + newFilePath);
            }
        }

        if (!file) {
            throw Error("Le fichier n'existe pas : " + newFilePath);
        }
        
        await waitForFileMetaDataUpdate(this.app, file.path, "Classe", async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            if (!file) { return; }
            let classe = this.getFromFile(file);
            if (!classe) {
                console.error("Classe non trouvée pour le fichier : " + file.path);
                return;
            }
            await classe.populate(args);
            await classe.check();
            await classe.update();
            console.log("Classe créée : " + classe.getName(false));
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
            const classe = this.getFromFile(file);
            if (classe && typeof classe.update === 'function') {
                await classe.update();
            }
            if (classe && typeof classe.check === 'function') {
                await classe.check();
            }

            // Remove the duplicates
            /*
            for (let file2 of this.app.vault.getFiles()) {
                // Compare the name
                if (file.name === file2.name && file.path != file2.path && this.getFromFile(file)?.getClasse() === this.getFromFile(file2)?.getClasse()) {
                    console.error("Doublon de \n" + file.path + "\n" + file2.path);
                    // Keep the first by default
                    await this.app.vault.delete(file2);
                }
            }*/
            watchedFiles.push(file.name);
        }

        // Remove empty folders 
        for (let folder of this.app.vault.getAllFolders()) {
            if (folder.children && folder.children.length === 0) {
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