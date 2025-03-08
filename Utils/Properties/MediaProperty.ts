import { File } from "Utils/File";
import { Property } from "./Property";
import { Classe } from "Classes/Classe";
import { MyVault } from "Utils/MyVault";
import { Notice, setIcon, TFile } from "obsidian";
import { selectFile } from "Utils/Modals/Modals";
import { FileProperty } from "./FileProperty";


export class MediaProperty extends FileProperty{

    public classe : typeof Classe;
    // Used for property with a single file
    constructor(name : string, icon: string = "file") {
      super(name, Classe, icon)
    }

    async check(file: File){
        // Check if it is a file link
        let value = this.read(file)
        if (value && value.length && !file.linkRegex.test(value)) {
          // rajoute les [[ ]]
          if (value.length){
              value = `"[[${value}]]"`
          }
          await file.updateMetadata(this.name, value);
        }
    }

    // TODO


}