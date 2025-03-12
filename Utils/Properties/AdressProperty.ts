import { LinkProperty } from "./LinkProperty";
import { Property } from "./Property";
import axios from 'axios';



export class AdressProperty extends Property{

  public type : string = "adress";

    // Used for property hidden for the user
    constructor(name : string, icon: string = "map-pinned") {
      super(name, icon)
    }
}