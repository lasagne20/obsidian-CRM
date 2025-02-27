import { File } from "Utils/File";
import { Property } from "./Property";
import { App } from "obsidian";
import { FileProperty } from "./FileProperty";
import { Classe } from "Classes/Classe";


export class MultiFileProperty extends FileProperty{
    // Used for property with a single file
    constructor(name : string, classe : typeof Classe) {
      super(name, classe)
    }

    async check(file: File) {
        // Check if it is a file link
        return
        let values = this.read(file);
        
        for (const value of values) {
            console.log(value)
            if (value && !file.linkRegex.test(value)) {
                // rajoute les [[ ]]
                await file.updateMetadata(this.name, `"[[${value}]]"`);
            }
        }
    }


    getLink(file : File){
      let list = this.read(file)
      if (typeof list === "string"){return file.getFromLink(list.slice(2, -2))}
      if (list && list.length){
        const fileName = list[0].slice(2, -2) // Enlève les [[ et ]]
        return file.getFromLink(fileName)
      }  
      return null
    }



}