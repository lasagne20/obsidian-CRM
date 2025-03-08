import { Classe } from 'Classes/Classe';
import { Property } from './Property';

export class FormulaProperty extends Property {

    public formula : string;

    constructor(name : string, formula: string, icon : string = "") {
        super(name, icon, true);
        this.formula = formula;
    }

    read(file: Classe) : any {
        
            const properties = Object.fromEntries(
                Object.entries(file.getProperties()).map(
                    ([name, p]: [string, Property]) => [name, p.read(file)]
                )
            );
            const subProperties = Object.fromEntries(
                Object.entries(file.getSubProperties()).map(
                    ([name, p]: [string, Property]) => [name, p.read(file)]
                )
            );

            const allProperties = { ...properties, ...subProperties };
            
        try {
            const formulaFunction = new Function(
                `
                    const { ${Object.keys(allProperties).join(", ")} } = ${JSON.stringify(allProperties)};
                    ${this.formula.contains("return") ? "\n" : "return " }${this.formula};
                `
            );
            return formulaFunction();
        } catch (error) {
            if (error instanceof ReferenceError){
                console.error("Formula error : " + this.formula + "\n\n"
                    + error 
                    + "\n\nThis is all the properties available : ", Object.keys(allProperties).join(", "));
            }
            else {
                console.error("Formula error : " + this.formula + "\n\n" + error);
            }
            return null;
        }
    }

}