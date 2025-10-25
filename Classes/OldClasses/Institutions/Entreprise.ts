import { SubClass } from "../SubClass";
import { Data } from "Utils/Data/Data";
import { Classe } from "Classes/Classe";


export class Entreprise extends SubClass {

    public subClassName : string = "Entreprise";
    public subClassIcon : string = "box";

    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);

    }

    getConstructor(){
        return Entreprise
      }
}