import { Data } from "./Data";
import { DepartementData } from "./DepartementData";

export class RegionData extends Data{
    public departements: DepartementData[];
    public static className = "Region";

    constructor(
        name: string,
        public code: string,
        departementsData: { [key: string]: any }
    ) {
        super(name)
        this.departements = Object.keys(departementsData).map(name => new DepartementData(
            name,
            departementsData[name].code,
            departementsData[name].epci,
            departementsData[name].communes
            , departementsData[name].geodata
        ));
    }

    public getDepartements(): DepartementData[] {
        return this.departements;
    }

    public getName(){
        return `${this.code} - ${this.name}`
    }

    public getAllNames() : string[]{
        return [...this.departements.flatMap(departement => departement.getAllNames()), this.getName()]
    }

    public getParent(formattedName : string){
        if (this.departements.map(x => x.getName()).contains(formattedName)){return this}
        for (let dep of this.departements){
            let parent = dep.getParent(formattedName)
            if (parent){return parent}
        }
    }

    public find(formattedName : string){
        if (formattedName === this.getName()){return this}
        for (let dep of this.departements){
            let element = dep.find(formattedName)
            if (element){return element}
        }
    }

    public getList(classeName: string) : any[]{
        if (classeName == DepartementData.getClasse()){return this.departements}
        for (let dep of this.departements){
            let element = dep.getList(classeName)
            if (element){return element}
        }
        return []
    }

    getClasse(){
        return RegionData.className
    }

    static getClasse(){
        return RegionData.className
    }
}