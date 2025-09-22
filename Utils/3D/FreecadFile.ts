import { Classe } from "Classes/Classe";
import { XMLParser } from "fast-xml-parser";
import * as JSZip from "jszip";
import { Notice, TFile } from "obsidian";
import { selectMedia } from "Utils/Modals/Modals";
import { FreecadData } from "./FreecadData";
import { normalize } from "path";
import { AnyPtrRecord } from "dns";


const FREECAD_DATE_CHECK = "FreecadLastCheck"

export class FreecadFile {

    private jsonData : any = null;
    public vault: any;
    public file : TFile
    private lastCheck: Date | null = null;

    constructor(vault: any, file: TFile) {
        this.vault = vault;
        if (!file.path.endsWith('.FCStd') && !file.path.endsWith('.fcstd')) {
            throw new Error('Le fichier doit avoir une extension .FCStd');
        }
        this.file = file;
    }

    static async createFreecadFileWithAssembly(vault: any, filePath: string, assemblyName: string): Promise<void> {
            if (!filePath.endsWith('.FCStd')) {
            throw new Error('Le fichier doit avoir une extension .FCStd');
        }

        // Lire le fichier FreeCAD existant
        let templatPath = vault.settings.templateFolder + "/FreecadTemplate.FCStd";
        await selectMedia(vault, "Sélectionner le modèle FreeCAD", ["fcstd"], vault.settings.templateFolder).then((file) => {
            if (!file) {
                throw new Error("Aucun modèle FreeCAD sélectionné.");
            }
            templatPath = file.path;
        });
        const existingContent = await vault.app.vault.adapter.readBinary(templatPath);
        const zip = await JSZip.loadAsync(existingContent);

        // Modifier le Document.xml pour changer l'assembly
        const documentXml = await zip.file("Document.xml")?.async("string");
        if (!documentXml) throw new Error("Document.xml introuvable dans le fichier existant.");

        // Remplacer le nom de l'assembly (exemple simple, à adapter selon la structure XML)
        let updatedDocumentXml = documentXml.replace("$AssemblyName$", assemblyName)

        zip.file("Document.xml", updatedDocumentXml);

        // Générer le nouveau contenu
        const newContent = await zip.generateAsync({ type: "uint8array" });

        // Écrire le nouveau fichier (vous pouvez choisir un nouveau chemin si besoin)
        console.log("Writing FreeCAD file to:", filePath);
        await vault.app.vault.adapter.writeBinary(filePath, newContent);
        return Promise.resolve();
    }

    async checkUpdate() : Promise<boolean> {
        if (this.jsonData === null) {
            // Set json data 
            await this.generateJsonData();
            return true;
        }

        // Rafraîchir les métadonnées du fichier pour obtenir les stats à jour
        
        const stat = await this.vault.app.vault.adapter.stat(this.file.path);
        if (stat && this.lastCheck && this.lastCheck.toISOString() === new Date(stat.mtime).toISOString() ) {
            return false;
        }
        // Update the last check time using ISO date format
        if (stat && stat.mtime !== undefined) {
            this.lastCheck = new Date(stat.mtime);
        }
        await this.generateJsonData();
        console.log("Le fichier a été modifié depuis la dernière vérification.");
        return true;
    }

    async generateJsonData() {
        try{
            const data = this.vault.app.vault.adapter.readBinary(this.file.path);
            // Charger le zip
            const zip = await JSZip.loadAsync(data);

            // Extraire le Document.xml
            const docXml = await zip.file('Document.xml')?.async('text');
            if (!docXml) {
                new Notice('Document.xml non trouvé dans le fichier FreeCAD.');
                return [];
            }

            // Parser le XML
            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '',
            });
            let doc = parser.parse(docXml);
            this.jsonData = this.reorderJsonData(doc);
            const stat = await this.vault.app.vault.adapter.stat(this.file.path);
            
            this.lastCheck = new Date(stat.mtime);
        }
        catch (error) {
            console.error("Erreur lors de la génération des données JSON :", error);
            throw new Error('Erreur lors de la génération des données JSON du fichier FreeCAD.');
        }

    }

    isReady() : boolean {
        return this.jsonData !== null;
    }

    convertPathtoLink(path: string): string {
        if (!path) {return "";}
        // Convertit le chemin en utilisant le basePath du vault
        const vaultBasePath = normalize(this.vault.app.vault.adapter.basePath || "").replace(/\\/g, "/");
        if (path && path.toLowerCase().startsWith(vaultBasePath.toLowerCase())) {
            path = path.substring(vaultBasePath.length).replace(/^[/\\]+/, "");
        }
        return `[[${path}|${path?.split("/").pop()?.split("\\").pop()}]]`;
    }

    reorderJsonData(doc: any) {
        // Reorder the JSON data to have a consistent structure
        const objects = Array.isArray(doc.Document.Objects.Object) ? doc.Document.Objects.Object : [doc.Document.Objects.Object];
        const objectData = Array.isArray(doc.Document.ObjectData.Object) ? doc.Document.ObjectData.Object : [doc.Document.ObjectData.Object];
        
        console.log("Objet FreeCAD :", objects);
        console.log("Objet Data FreeCAD :", objectData);

        if (objects.length !== objectData.length) {
            throw Error("Le nombre d'objets et de données d'objets ne correspond pas.");
        }

        let data : any= {};
        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            const properties = objectData[i].Properties.Property || [];
            let name = properties.find((prop: any) => prop.name === "Label")?.String?.value || obj.name;

            if (properties.find((prop: any) => prop.name === "Hidden")?.Bool?.value === "true") {
                // Si l'objet est caché, on ne l'ajoute pas aux données
                continue;
            }

            let modelPath =  properties.find((prop: any) => prop.name === "GLBPath")?.String?.value || "";

            let values;
            // Part design objects
            if (obj.type == "PartDesign::Body" || obj.type == "Part::Feature") {
                values = {
                    type : obj.type,
                    objectName : obj.name,
                    material: properties.find((prop: any) => prop.name === "MaterialName")?.String?.value || "",
                    model : this.convertPathtoLink(modelPath),
                    number : 1,
                    code: this.normalizeName(name),
                    dimensions : properties.find((prop: any) => prop.name === "Dimensions")?.String?.value || "",
                    svg : this.convertPathtoLink(properties.find((prop: any) => prop.name === "SVGPath")?.String?.value),
                };
            }
            // Assemblies objects
            else if (obj.type == "Assembly::AssemblyObject") {
                let group = properties.find((prop: any) => prop.name === "Group")?.LinkList.Link || "";
                values = {
                    type : obj.type,
                    objectName : obj.name,
                    model : this.convertPathtoLink(modelPath),
                    group: Array.isArray(group) ? group.map((item: any) => item.value) : [],
                    pieces : {},
                    link : {},
                    number : 1,
                    code: this.normalizeName(name),
                };
            }

            // List of assemblies links
            else if (obj.type == "Assembly::AssemblyLink") {
                let xlink = properties.find((prop: any) => prop.name === "LinkedObject")?.XLink || "";
                let group = properties.find((prop: any) => prop.name === "Group")?.LinkList?.Link || [];
                let fileName = xlink.file?.split("/").pop().split("\\").pop() || "";
                values = {
                        type : obj.type,
                        objectName : obj.name,
                        path : xlink.file,
                        fileName : fileName || "",
                        assemblyName: xlink.name,
                        number : 1,
                        group : group.map((item: any) => item.value),
                        pieces : {},
                        code: this.normalizeName(name),
                    };
                }

            // List of parts links
            else if (obj.type == "App::Link") {
                let dataLink = properties.find((prop: any) => prop.name === "DataLink")?.Map?.Item;
                if (!dataLink) {
                    console.warn("Aucune donnée de lien trouvée pour l'objet :", obj.name);
                    continue;
                }
                let path = dataLink.find((item: any) => item.key === "DocumentPath")?.value || "";
                let bodyName = dataLink.find((item: any) => item.key === "ObjectName")?.value || "";
                let fileName = path.split("/").pop().split("\\").pop()  || "";
                values = {
                            type : obj.type,
                            objectName : obj.name,
                            path : path,
                            fileName : fileName || "",
                            bodyName: bodyName,
                            number : 1,
                            code: this.normalizeName(name),
                        };
                }

            // List of folder groups
            else if (obj.type == "App::DocumentObjectGroup") {
                values = {
                    type : obj.type,
                    objectName : obj.name,
                    code: this.normalizeName(name),
                    material: properties.find((prop: any) => prop.name === "Material")?.String?.value || "",
                };
            }

            // List of global variables
            else if (obj.type == "App::VarSet") {
                values = {
                    type : obj.type,
                    objectName : obj.name,
                    code: name,
                    variables: properties.map((prop: any) => ({
                        name: prop.name,
                        value: prop.value
                    }))
                    
                };
            } 


            else if (obj.type == "Part::FeaturePython" && (obj.name.startsWith("Screw") ||  obj.name.startsWith("Nut"))) {
                // special case for screws generated by FreeCAD
                values = {
                    type : "VIS",
                    objectName : obj.name,
                    code: this.normalizeName(name),
                    model : this.convertPathtoLink(modelPath) || "",
                    number : 1,
                };

            }
            if (values) {
                data[name] = values
            }

        }

        this.fillAssembliesData(data, data);

        // Supprime les clés de data qui contiennent un "_001"
        for (const key of Object.keys(data)) {
            if (/_\d{3}$/.test(key)) {
                delete data[key];
            }
            else {
                const normalizedKey = this.normalizeName(key);
                if (normalizedKey !== key && data[normalizedKey] === undefined) {
                    data[normalizedKey] = data[key];
                    delete data[key];
                }
            }
        }
        
        console.log("Données JSON réordonnées :", data);
        return data;
    }

    /**
     * Réorganise les éléments de data pour qu'ils soient rangés dans "pieces" des assemblages.
     * Cette fonction parcourt tous les objets et place ceux référencés dans les groupes d'assemblages
     * dans la propriété "pieces" correspondante.
     * Retourne un nouvel objet data propre, ne contenant que les éléments racines (non inclus dans un groupe).
     */
    private fillAssembliesData(data: any, rootData: any): any {
        // Remplir les pièces des assemblages et marquer les inclus
        for (const key in data) {
            const item = data[key];
            if (item.type === "Assembly::AssemblyObject" || item.type === "Assembly::AssemblyLink") {
                if (Array.isArray(item.group)) {
                    for (const groupName of item.group) {
                        const [foundKey, foundObj] = this.findObjectName(rootData, groupName);
                        if (foundKey && foundObj) {
                            const normalized = this.normalizeName(foundKey);
                            if (!item.pieces[normalized]) {
                                item.pieces[normalized] = foundObj;
                            }
                            else {
                                item.pieces[normalized].number += 1;

                                // remove the object from the rootData if it is included in a group
                                if (foundObj.type === "Assembly::AssemblyObject" || foundObj.type === "Assembly::AssemblyLink") {
                                    for (let itemSup of foundObj.group){
                                        let toSupp = Object.keys(rootData).filter((key) => rootData[key].objectName === itemSup)[0]
                                        if (toSupp) {
                                            delete rootData[toSupp]
                                        }
                                    }
                                }

                            }
                            if (rootData[foundKey]) {
                                delete rootData[foundKey]; // Supprimer l'élément de la racine s'il est inclus dans un groupe
                            }
                        }
                    }
                }
                // Appel récursif pour les sous-assemblages
                this.fillAssembliesData(item.pieces, rootData);
            }
        }

    }

    private findObjectName(data: any, objectName: string) : [any, any] {
        for(const key of Object.keys(data)) {
            if (objectName === data[key].objectName) {
                return [key, data[key]];
            }
            if (data[key].pieces) {
                let infos = this.findObjectName(data[key].pieces, objectName)
                if (infos[0] !== null && infos[1] !== null) {return infos;}
            }
        }
        return [null, null];
    }

    private normalizeName(name: string) : string {
        // Supprime les suffixes du type ' 001', '002', '-001', '-002', etc. à la fin du nom pour la comparaison
        return name.replace(/(\s|_)\d{3}$/, "").replace("_","").trim();
    }

    private findExistingObject(data: any, name: string) : any {
        for(const key in data) {
            // Supprime les suffixes du type ' 001', ' 002', etc. à la fin du nom pour la comparaison
            if (this.normalizeName(name) === key) {
                return data[key];
            }
            if (["Assembly::AssemblyObject", "Assembly::AssemblyLink"].includes(data[key].type)) {
                let infos = this.findExistingObject(data[key].pieces, name)
                if (infos) {return infos;}
            }
        }
        return null;
    }

    private findReferenceObject(data: any, name: string,  objectName : string) : any {
        for(const key in data) {
            if (["Assembly::AssemblyObject", "Assembly::AssemblyLink"].includes(data[key].type)) {
                if (data[key].group.includes(objectName)) {
                    return data[key].pieces;
                }
                let infos = this.findReferenceObject(data[key].pieces, name, objectName)
                if (infos) {return infos;}
            }
        }
        return null;
    }

    private findObjectInData(data: any, name: string) : FreecadData | null {
        for (const key in data) {
            if (key === name) {
                return data[key];
            }
            if (data[key].type === "Assembly::AssemblyObject" || data[key].type === "Assembly::AssemblyLink") {
                let found = this.findObjectInData(data[key].pieces, name);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }

    getObjectData(name: string, data?: any) : FreecadData | null {
        if (this.jsonData === null) {
            console.error('Les données JSON n\'ont pas été générées. Veuillez appeler generateJsonData() d\'abord.');
            return null;
        }
        const object = this.findObjectInData(data ? data : this.jsonData, name);
        if (object) {
            return new FreecadData(name, object);
        }
        return null;
    }

    getData(name : string = "")  : any {
        if (this.jsonData === null) {
            console.error('Les données JSON n\'ont pas été générées. Veuillez appeler generateJsonData() d\'abord.');
            return [];
        }
        let data = this.jsonData 
        if (name) {
            let element = this.findExistingObject(data, name)
            if (element && element.pieces){
                data = element.pieces
            }
            else {
                return element
            }
        }
        return Object.entries(data as Record<string, any>)
            .map(([name, part]: [string, any]) => new FreecadData(name, part));
    }

    getAllElementsData(assemblyName : string = "") : any[] {
        if (this.jsonData === null) {
            console.error('Les données JSON n\'ont pas été générées. Veuillez appeler generateJsonData() d\'abord.');
            return [];
        }
        let data = this.jsonData 
        if (assemblyName) {
            let pieces = this.findExistingObject(data, assemblyName)?.pieces
            data = pieces ? pieces : data;
        }
        return Object.entries(data as Record<string, any>)
            .filter(([_, part]: [string, any]) => ["Assembly::AssemblyLink", "Assembly::AssemblyObject","PartDesign::Body","App::Link", "VIS", "Part::Feature"].includes(part.type))
            .map(([name, part]: [string, any]) => new FreecadData(name, part));
    }

    



}