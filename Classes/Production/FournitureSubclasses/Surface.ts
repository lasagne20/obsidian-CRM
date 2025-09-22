
import { Property } from "Utils/Properties/Property";
import { Classe } from "Classes/Classe";
import { Data } from "Utils/Data/Data";
import { SubClass } from "Classes/SubClasses/SubClass";
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";




export class Surface extends SubClass {

    public subClassName : string = "Surface";
    public static subClassIcon : string = "";

    public static Properties : { [key: string]: Property } = {
    }


    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);
    }

    getConstructor(){
        return Surface
      }

    async populate(...args : any[]){
        
    }

    getTopDisplayContent(classe: Classe) : any{
        const container = document.createElement("div");

        return container;
    }
}