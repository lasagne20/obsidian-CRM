import { CommuneData } from "./CommuneData";
import { Data } from "./Data";
import { EPCIData } from "./EPCIData";


export class DepartementData extends Data{
    public epci: EPCIData[];
    public communes: CommuneData[];
    public static className = "Departement";
    public geoData: any;

    constructor(
        name: string,
        public code: string,
        epciData: { [key: string]: any },
        communesData: any[],
        geoData : any
    ) {
        super(name)
        this.epci = Object.keys(epciData).map(name => new EPCIData(
            name,
            epciData[name].code,
            epciData[name].communes
        ));
        this.communes = communesData.map(commune => new CommuneData(
            commune.nom,
            commune.code,
            commune.codesPostaux,
            commune.population,
            commune.siren,
            commune.longitude,
            commune.latitude,
            this
        ));
        this.geoData = geoData;
    }

    public getCommunes(): CommuneData[] {
        return this.communes;
    }

    public getEPCI(): EPCIData[] {
        return this.epci;
    }

    public getName(formatted=true){
        if (!formatted){return this.name}
        return `${this.code} - ${this.name}`
    }

    public getAllNames() : string[]{
        return [...this.communes.map(com => com.getName()),
            ...this.epci.flatMap(epci => epci.getAllNames()),
            this.getName()]
    }

    public getParent(formattedName : string) : any{
        if (this.communes.map(x => x.getName()).contains(formattedName)){return this}
        if (this.epci.map(x => x.getName()).contains(formattedName)){return this}
        for (let epci of this.epci){
            let parent = epci.getParent(formattedName)
            if (parent){return parent}
        }
    }

    public find(formattedName : string){
        if (formattedName === this.getName()){return this}
        for (let com of this.communes){
            if (com.getName() == formattedName){
                return com
            }
        }
        for (let epci of this.epci){
            let element = epci.find(formattedName)
            if (element){return element}
        }
    }

    public getList(classeName: string) : any[]{
        if (classeName == EPCIData.getClasse()){return this.epci}
        if (classeName == CommuneData.getClasse()){
            return this.communes.concat([...this.epci.map(x => x.communes)].flat())
        }
        for (let epci of this.epci){
            let element = epci.getList(classeName)
            if (element){return element}
        }
        for (let com of this.communes){
            let element = com.getList(classeName)
            if (element){return element}
        }
        return []
    }

    getClasse(){
        return DepartementData.className
    }

    static getClasse(){
        return DepartementData.className
    }
}