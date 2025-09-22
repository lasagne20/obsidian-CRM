
import { Property } from "Utils/Properties/Property";
import { Classe } from "Classes/Classe";
import { Data } from "Utils/Data/Data";
import { SubClass } from "Classes/SubClasses/SubClass";
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";




export class FreecadSubclasse extends SubClass {

    public subClassName : string = "Freecad Subclasse";
    public static subClassIcon : string = "";

    public static Properties : { [key: string]: Property } = {
             code : new FormulaProperty(
               "Code",
               `let code = name.split(" - ")[0];
                 return code;
               `,
               {icon: "code", static: true, write: true}),
             model : new MediaProperty("Modele3D", {icon: "cube3d", create: "freecad"}),
    }


    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);
    }

    getConstructor(){
        return FreecadSubclasse
      }

    async populate(...args : any[]){
        
    }

    getTopDisplayContent(classe: Classe) : any{
        const container = document.createElement("div");

        return container;
    }
}