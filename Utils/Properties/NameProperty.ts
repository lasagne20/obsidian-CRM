import { Property } from "./Property";

export class NameProperty extends Property{

     public type : string = "name";

    // Used for property hidden for the user
    constructor() {
      super("name", {static : true});
    }

    read(file: any) {
      return file.getLink()
    }

}