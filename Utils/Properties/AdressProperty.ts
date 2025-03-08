import { LinkProperty } from "./LinkProperty";
import { Property } from "./Property";



export class AdressProperty extends Property{


    // Used for property hidden for the user
    constructor(name : string, icon: string = "map-pinned") {
      super(name, icon)
    }
}