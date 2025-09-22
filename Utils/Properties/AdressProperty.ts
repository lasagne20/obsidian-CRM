import { LinkProperty } from "./LinkProperty";
import { Property } from "./Property";
import axios from 'axios';



export class AdressProperty extends LinkProperty{

  public type : string = "adress";

    // Used for property hidden for the user
    constructor(name : string, args : {}= {icon: "map-pinned"}) {
      super(name, args)
    }

    
    validate(value: string) {
      return value;
   }

    getLink(value: string): string {
      return `https://www.google.com/maps/search/${encodeURIComponent(value)}`;
    }
}