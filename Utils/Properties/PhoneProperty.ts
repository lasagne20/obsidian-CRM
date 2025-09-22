import { LinkProperty } from "./LinkProperty";
import { Property } from "./Property";



export class PhoneProperty extends LinkProperty{

  public type : string = "phone";
    // Used for property hidden for the user
    constructor(name : string, args : {} = {icon: "phone"}) {
      super(name, args)
    }

    validate(phoneNumber: string) {
      let cleaned = phoneNumber.replace(/[^0-9]/g, "");
  
      if (cleaned.length !== 10) {
          return "";
      }
  
      const corrected = cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1.$2.$3.$4.$5");
      return corrected;
  }

  getPretty(value: string) {
    if (!value) return value;
    return this.validate(value);  
 }

  getLink(value : string){
    return `callto:${value?.replace(".","")}`
  }
}