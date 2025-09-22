
import { Property } from "Utils/Properties/Property";
import { Classe } from "Classes/Classe";
import { Data } from "Utils/Data/Data";
import { SubClass } from "Classes/SubClasses/SubClass";
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";
import { DynamicTable } from "Utils/Display/DynamicTable";




export class Unitaire extends SubClass {

    public subClassName : string = "Unitaire";
    public static subClassIcon : string = "";

    public static Properties : { [key: string]: Property } = {
    }


    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);
    }

    getConstructor(){
        return Unitaire
      }

    async populate(...args : any[]){
        
    }

    getTopDisplayContent(classe: any) : any{
        const container = document.createElement("div");
        let countInfos =  classe.getCount()
        let countTable = new DynamicTable(classe.vault, countInfos.map((info : any) => info.classe))
        countTable.addDisplayPropertyColumn("Nombre", countInfos.map((info : any) => {
        const span = document.createElement("span");
        span.textContent = info.count.toString();
        return {classe: info.classe, display: span};
        }))
        countTable.addDisplayPropertyColumn("Niveau", countInfos.map((info : any)=> {
        const span = document.createElement("span");
        span.textContent = info.level.toString();
        return {classe: info.classe, display: span};
        }))
        container.appendChild(countTable.getTable())
        return container;
    }
}