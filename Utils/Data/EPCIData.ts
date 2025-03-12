import { CommuneData } from "./CommuneData";
import { Data } from "./Data";

export class EPCIData extends Data {
    public communes: CommuneData[];
    public static className = "EPCI";

    constructor(
        name: string,
        public code: string,
        communesData: any[]
    ) {
        super(name)
        this.communes = communesData.map(communeData => new CommuneData(
            communeData.nom,
            communeData.code,
            communeData.codesPostaux,
            communeData.population,
            communeData.siren,
            this
        ));
    }

    getAllProperties(): { [key: string]: any }{
        return {"code": this.code}
    }

    public getCommunes(): CommuneData[] {
        return this.communes;
    }

    public getAllNames() : string[]{
        return [...this.communes.map(com => com.getName()), this.getName()]
    }

    public getParent(formattedName : string){
        if (this.communes.map(x => x.getName()).contains(formattedName)){return this}
    }
    
    public find(formattedName : string){
        if (formattedName === this.getName()){return this}
        for (let com of this.communes){
            if (com.getName() == formattedName){
                return com
            }
        }
    }

    public getList(classeName: string) : any[]{
        if (classeName == CommuneData.getClasse()){return this.communes}
        for (let com of this.communes){
            let element = com.getList(classeName)
            if (element){return element}
        }
        return []
    }

    getClasse(){
        return EPCIData.className
    }

    static getClasse(){
        return EPCIData.className
    }
}