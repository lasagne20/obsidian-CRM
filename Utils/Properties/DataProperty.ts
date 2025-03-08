import { File } from "Utils/File";
import { Property } from "./Property";

export class DataProperty extends Property{

    public data : any;

    constructor(name : string, icon: string = "database") {
      super(name, icon)
    }

}