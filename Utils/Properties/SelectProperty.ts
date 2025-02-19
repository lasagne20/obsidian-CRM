import { Property } from "./Property";


export class SelectProperty extends Property{
    // Used for property select

    public list : Array<string>;

    constructor(name : string, list : Array<string>) {
      super(name)
      this.list = list;
    }

}