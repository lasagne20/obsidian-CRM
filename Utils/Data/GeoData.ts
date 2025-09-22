import { App } from 'obsidian';
import { GenerativeData } from './GenerativeData';
import { RegionData } from './RegionData';
import { Data } from './Data';


class GeoDataStructure extends Data{

    public regions: RegionData[];

    constructor(
        regionsData: { [key: string]: any }
    ) {
        super("National")
        this.regions = Object.keys(regionsData).map(regionname => new RegionData(
            regionname,
            regionsData[regionname].code,
            regionsData[regionname].departements
        ));
    }

    public getName(){
        return "National"
    }

    public getAllNames() : string[]{
        return [...this.regions.map(region => region.getAllNames()), this.getName()].flat()
    }

    public getParent(name : string){
        if (name === this.getName()){return null}
        if (this.regions.map(x => x.getName()).contains(name)){return this}
        for (let region of this.regions){
            let parent = region.getParent(name)
            if (parent){return parent}
        }
        throw Error("Element not found : " + name);
    }

    public find(name : string){
        if (name === this.getName()){return this}
        for (let region of this.regions){
            let element = region.find(name)
            if (element){return element}
        }
    }

    public getList(classeName: string) : any[]{
        if (classeName === this.getClasse()){return [this]}
        if (classeName == RegionData.getClasse()){return this.regions}
        for (let region of this.regions){
            let element = region.getList(classeName)
            if (element){return element}
        }
        return []
    }

    getClasse(){
        return this.getName()
    }
   
}

export class GeoData {
    private data: GeoDataStructure;
    public generativeDataList: GenerativeData[];
    public app: App;

    constructor(app: App, filePath: string, generativeSettings: { [key: string]: string }[]) {
        this.app = app;
        this.loadGeoData(filePath, generativeSettings);
    }

    private async loadGeoData(filePath: string, generativeSettings: { [key: string]: string }[]) {
        try {
            const rawData = await this.app.vault.adapter.read(filePath);
            const parsedData = JSON.parse(rawData);
            this.data = new GeoDataStructure(parsedData.National);
        } catch (error) {
            console.error("Error while loading GeoData", error);
        }
        for (let setting of generativeSettings){
            await this.loadGenerativeData(setting.path, setting.subClass)
        }
        console.log("GeoData loaded");
    }

    private async loadGenerativeData(filePath: string, subclassName : string){
        try {
            const rawData = await this.app.vault.adapter.read(filePath);
            const parsedData = JSON.parse(rawData);
            for (let name of Object.keys(parsedData)){
                let geo = this.data.find(name)
                if (geo) {
                    if (geo.getClasse() == subclassName) {
                        Object.assign(geo, parsedData[name]);
                    } else {
                        let value: { [key: string]: any } = {}
                        value[subclassName] = parsedData[name]
                        for (let el of value[subclassName]){
                            el["parent"] = geo
                        }
                        Object.assign(geo, value);
                    }
                }
            }
        } catch (error) {
            console.error("Error while loading "+subclassName, error);
        }
    }

    public getGeoData(name: string) {
        if (this.data == undefined) {
            return null;
        }
        return this.data.find(name)
    }

    public getGeoDataList(location: string, locationType: string, subclassName: string): any[] {
        let locations = this.data.find(location)?.getList(locationType) || []
        if (subclassName != locationType){
            locations = locations.map((location: any) => location.getList(subclassName)).flat()
        }
        return locations
    }

    public getAllNames(): string[] {
        return this.data.getAllNames()
    }

    public getAllClasseNames(className: string): string[] {
        return this.data.find("National")?.getList(className).map((x: any) => x.getName()) || []
    }


    public getParent(formattedName: string): string | null {
        const parentName = this.data.getParent(formattedName)?.getName();
        return parentName !== undefined ? parentName : null;
    }

    public getClassName(formattedName: string): string | null {
        return this.data.find(formattedName)?.getClasse() ?? null
    }
}
