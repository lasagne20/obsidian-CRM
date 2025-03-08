import { App } from "obsidian";

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

