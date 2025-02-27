import { File } from "Utils/File";

export class Property{
    public name: string;

    constructor(name : string) {
      this.name = name;
    }

    read(file: File) {
        // Vérifie si la méthode getMetadata() existe sur l'objet 'file'
        const metadata = file.getMetadata();
        if (metadata && this.name in metadata) {
          return metadata[this.name];  // Retourne la valeur associée à cette propriété
        } else {
          return null;  // Si la propriété n'existe pas, retourne null
        }
      }

    check(file: File){

    }

}