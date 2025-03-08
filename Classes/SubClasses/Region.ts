import { App } from "obsidian";
import { SubClass } from "./SubClass";
import { MyVault } from "Utils/MyVault";
import { Data } from "Utils/Data/Data";
import { Classe } from "Classes/Classe";


export class Region extends SubClass {

    public subClassName : string = "Region";
    public subClassIcon : string = "box";

    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);

    }

    getConstructor(){
        return Region
      }
}