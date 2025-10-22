
import { Property } from "Utils/Properties/Property";
import { Classe } from "Classes/Classe";
import { Data } from "Utils/Data/Data";
import { SubClass } from "Classes/SubClasses/SubClass";
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";
import { add } from "cheerio/dist/commonjs/api/traversing";
import { addButton } from "Utils/Display/Utils";
import { generateLightBurnFile } from "Utils/2D/SurfaceCompute";
import { title } from "process";
import { Notice } from "obsidian";
import { TimeProperty } from "Utils/Properties/TimeProperty ";
import { icon } from "leaflet";




export class DecoupeLaserProcedure extends SubClass {

    public subClassName : string = "Découpe laser";
    public static subClassIcon : string = "";

    public static Properties : { [key: string]: Property } = {
        lightBurnFile : new MediaProperty("Fichier LightBurn", {icon: "file", display: "button", create: "LightBurn"}),
        tempsDecoupe : new TimeProperty("Temps de découpe", {icon: "clock", format: "duration"}),
    }


    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);
    }

    getConstructor(){
        return DecoupeLaserProcedure 
      }

    async populate(...args : any[]){
        
    }

    async createLightBurnFile(classe: Classe) : Promise<string> {
            let svgPaths = classe.getConstructor().Properties.outputs.read(classe)
                .flatMap((output: any) => {
                    let images = classe.vault.getFromLink(output.Pièce)?.getMetadataValue("Images");
                    if (images) {
                        let svgImage = images
                            .map((image: string) => classe.vault.getMediaFromLink(image)?.path)
                            .find((image: string) => image && image.endsWith(".svg"));
                        if (svgImage) {
                            // Duplicate svgImage if Quantité > 1
                            console.log("output:", output, "svgImage:", svgImage);
                            const quantity = output.Quantité ? Number(output.Quantité) : 1;
                            return Array(quantity).fill(svgImage);
                        }
                    }
                    return [];
                }).flat()
                .filter((image: string) => image !== undefined && image !== null);

            console.log("Generating LightBurn file with paths: ", svgPaths);
            let filePath = classe.getFolderPath()+"/"+ classe.getName(false) + ".lbrn2"
            await generateLightBurnFile(classe.vault,
                filePath,
                svgPaths,
            );
            new Notice("Fichier Lightburn créé avec succès ! Ouverture dans 1 secondes...");
            return filePath

        }

    getTopDisplayContent(classe: Classe) : any{
        const container = document.createElement("div");

        container.appendChild((DecoupeLaserProcedure.Properties.lightBurnFile as MediaProperty).getDisplay(classe, {title: "Fichier LightBurn", display: "button",
            createOptions: {createFunction: async () => this.createLightBurnFile(classe), title: "Créer le fichier LightBurn"},
            updateOptions: {updateFunction: async () => this.createLightBurnFile(classe), icon: "refresh-ccw"}}));
        return container;
    }
}