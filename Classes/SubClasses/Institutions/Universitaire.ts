import { SubClass } from "../SubClass";
import { Data } from "Utils/Data/Data";
import { Classe } from "Classes/Classe";
import { MyVault } from "Utils/MyVault";


export class Universitaire extends SubClass {

    public subClassName : string = "Universitaire";
    public subClassIcon : string = "box";

    getConstructor(){
        return Universitaire
      }
}