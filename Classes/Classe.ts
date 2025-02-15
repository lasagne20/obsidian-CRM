import {TFile} from 'obsidian';

export class Classe {
    constructor(file : TFile) {
      this.file = file;
    }
  
    myMethod() {
      console.log("Hello from MyClass!");
    }
  }
  