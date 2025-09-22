import { Data } from "Utils/Data/Data";


export class FreecadData extends Data {
    public static className = "FreecadData";
    public Modele3D : string;

    constructor(
        public name: string,
        data  : { [key: string]: any } = {}
    ){
        super(name)
        Object.assign(this, data);
        this.Modele3D = data.model || "";
    }
    static getClasse(){
        return FreecadData.className
    }

    getClasse(){
        return FreecadData.className
    }
}