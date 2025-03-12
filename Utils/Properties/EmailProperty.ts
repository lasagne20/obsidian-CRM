import { LinkProperty } from "./LinkProperty";
import { Property } from "./Property";



export class EmailProperty extends LinkProperty{


  public type : string = "email";
    // Used for property hidden for the user
    constructor(name : string, icon: string = "mail",  staticProperty : boolean=false) {
      super(name, icon, staticProperty)
    }

    validate(email: string): string {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if(emailRegex.test(email)){
          return email
      }
      return ""
    }

    createFieldContainer() {
      const field = document.createElement("div");
      field.classList.add("metadata-field");
      field.classList.add("metadata-field-email");
      return field;
  }

    getLink(value: string): string {
      return `mailto:${value}`
    }
}