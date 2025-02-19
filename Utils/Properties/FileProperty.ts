import { File } from "Utils/File";
import { Property } from "./Property";
import { App } from "obsidian";
import { Classe } from "Classes/Classe";


export class FileProperty extends Property{

    public classe : typeof Classe;

    // Used for property with a single file
    constructor(name : string, classe: typeof Classe) {
      super(name)
      this.classe = classe;
    }

    async check(file: File){
        // Check if it is a file link
        let value = this.read(file)
        if (value && !file.linkRegex.test(value)) {
          // rajoute les [[ ]]
          if (value.length){
              value = `"[[${value}]]"`
          }
          await file.updateMetadata(this.name, value);
        }
    }

    getClasse(){
      return this.classe.getClasse()
   }

    getLink(file : File){
      this.check(file)
      const fileName = this.read(file)?.slice(2, -2); // Enlève les [[ et ]]
      // Rechercher le fichier dans la vault
      return file.getFromLink(fileName)
    }


}