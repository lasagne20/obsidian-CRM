import { SubClass } from 'Classes/SubClasses/SubClass';
import { SelectProperty } from './SelectProperty';
import { File } from 'Utils/File';
import { Property } from './Property';
import { Classe } from 'Classes/Classe';

export class SubClassProperty extends SelectProperty {

    public subClasses: SubClass[];
    public type : string = "subClass";

    constructor(name: string, subClasses: SubClass[], args = {}) {
        super(name, subClasses.map(subClass => ({ name: subClass.getsubClassName(), color: "" })), args);
        this.subClasses = subClasses;
    }

    getSubClassFromName(name : string){
        return this.subClasses.find(subClass => subClass.getsubClassName() === name)?.getConstructor()
    }

    public getSubClass(file: File) : SubClass | undefined {
        let value = this.read(file)
        return this.subClasses.find(subClass => subClass.getsubClassName() === value);
    }

    public getSubclassesNames(): SubClass[] {
        return this.subClasses;
    }

    public getSubClassProperty(file: File) : Property[] {
        let properties = this.getSubClass(file)?.getProperties();
        if (properties){
            return Object.values(properties);
        }
        return [];
    }

    getTopDisplayContent(file: Classe) : HTMLElement {
        const container = document.createElement("div");
        let subClass = this.getSubClass(file);
        if (subClass){
            container.appendChild(subClass.getTopDisplayContent(file));
        }
        return container;

    }
}