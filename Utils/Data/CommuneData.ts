import { Data } from "./Data"

export class CommuneData extends Data{
    public static className = "Commune";


    constructor(
        name: string,
        public code: string,
        public codesPostaux: string[],
        public population: number,
        public siren : string,
        public parent: any,
    ) {super(name)}

    public getName(){
        return `${this.codesPostaux[0]} - ${this.name}`
    }

    static getClasse(){
        return CommuneData.className
    }

    getClasse(){
        return CommuneData.className
    }


    public getList(classeName: string) : any[]{
        if (classeName in this){
            return this[classeName]
        }
        return []
    }
}