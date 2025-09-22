
import { Property } from "Utils/Properties/Property";
import { Classe } from "Classes/Classe";
import { Data } from "Utils/Data/Data";
import { SubClass } from "Classes/SubClasses/SubClass";
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";




export class Lineaire extends SubClass {

    public subClassName : string = "Linéaire";
    public static subClassIcon : string = "";

    public static Properties : { [key: string]: Property } = {
    }


    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);
    }

    getConstructor(){
        return Lineaire
      }

    async populate(...args : any[]){
        
    }

    getTopDisplayContent(classe: Classe) : any{
        const container = document.createElement("div");

        return container;
    }
}