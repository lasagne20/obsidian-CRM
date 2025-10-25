import { SubClass } from "../SubClass";
import { Data } from "Utils/Data/Data";
import { Classe } from "Classes/Classe";
import { MyVault } from "Utils/MyVault";


export class Ecole extends SubClass {

    public subClassName : string = "Ecole";
    public subClassIcon : string = "box";

    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);

    }

    getConstructor(){
        return Ecole
      }
}