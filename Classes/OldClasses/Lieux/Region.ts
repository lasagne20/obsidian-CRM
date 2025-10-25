import { Classe } from "Classes/Classe";
import { Data } from "Utils/Data/Data";
import { SubClass } from "../../SubClasses/SubClass";


export class Region extends SubClass {

    public subClassName : string = "Region";
    public subClassIcon : string = "box";

    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);

    }
    getConstructor(){
        return Region
      }
}