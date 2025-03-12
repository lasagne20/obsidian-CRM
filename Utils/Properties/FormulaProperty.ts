import { Classe } from 'Classes/Classe';
import { Property } from './Property';

export class FormulaProperty extends Property {

    public formula : string;
    public type : string = "formula";

    constructor(name : string, formula: string, icon : string = "") {
        super(name, icon, true);
        this.formula = formula;
    }

    read(file: Classe) : any {
        const allProperties = Object.values(file.getAllProperties()).map((property) => {
            return {
                [property.name]: property.read(file)
            };
        }).reduce((acc, prop) => ({ ...acc, ...prop }), {});
        console.log(allProperties);
        try {
            const formulaContent = 
                `
                    const properties = ${JSON.stringify(allProperties)};
                    const { ${Object.keys(allProperties).join(", ")} } = properties;
                    ${this.formula.includes("return") ? "\n" : "return " }${this.formula};
                `;
            console.log(formulaContent);
            const formulaFunction = new Function(formulaContent);
            console.log("Résultat : ", formulaFunction());
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