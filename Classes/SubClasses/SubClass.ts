import {TFile, App, TAbstractFile, TFolder} from 'obsidian';
import { MyVault } from '../../Utils/MyVault';
import { Property } from '../../Utils/Properties/Property';
import { Classe } from 'Classes/Classe';
import { Data } from 'Utils/Data/Data';


export class SubClass {
    public subClassName : string = "";
    public subClassIcon : string = "box";

    public app: App;
    public vault: MyVault;
    public classe: typeof Classe;
    
    public Properties: {[key: string]: Property};
    public data : Data | null;

    constructor(classe : typeof Classe, data : Data | null = null) {
      this.data = data
      this.classe = classe
    }

    getConstructor(){
      return SubClass
    }

    getsubClassName(): string{ 
      return this.subClassName;
    }

    getName(): string{
      if (this.data){
        return this.data.getName()
      }
      return "";
    }

    getMetadata(){
      if (this.data){
        return this.data
      }
    }

    async populate(...args : any[]){
    }

    getProperties(){
      return this.Properties
    }

    getAllProperties(){
      return {
      ...this.classe.Properties,
      ...this.getProperties()
      };
    }


    getSubProperties(){
      return {}
    }

    async update(){
       
    }

    getTopDisplayContent(classe: Classe) : any{
      const container =  document.createElement("div");
      return container
    }

    async check(){

    }
  }
  