import { App } from "obsidian";

function addMissingBrackets(input: string): string {
    // Vérifie si la chaîne commence et se termine par [[...]]
    const regex = /^\[\[([^\[\]]+)\]\]$/;
  
    // Si déjà au bon format, retourne tel quel
    if (regex.test(input)) {
      return input;
    }
  
    // Sinon, ajouter les crochets manquants
    return `[[${input}]]`;
  }

  export const waitForMetaDataCacheUpdate = (app: App, callback: () => void) => {
    return new Promise((resolve) => {
        const onResolved = async () => {
            app.metadataCache.off('resolved', onResolved);
            
            await callback(); // Exécute la fonction passée en argument
            
            resolve(0); // Résout la promesse une fois terminé
        };
        app.metadataCache.on('resolved', onResolved);
    });
};