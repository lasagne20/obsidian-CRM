import { SubClass } from "../../SubClasses/SubClass";


export class Universitaire extends SubClass {

    public subClassName : string = "Universitaire";
    public subClassIcon : string = "box";

    getConstructor(){
        return Universitaire
      }
}