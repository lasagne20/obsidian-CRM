import { App } from "obsidian";

/**
 * Attend que la metadata d'un fichier spécifique soit mise à jour (événement 'changed').
 * @param app L'instance Obsidian App
 * @param filePath Le chemin du fichier à surveiller (relatif au vault)
 * @param key La clé de la metadata à attendre (ex: 'frontmatter', 'tags', etc.)
 * @param callback Fonction appelée une fois la metadata mise à jour
 */
export const waitForFileMetaDataUpdate = async (
      app: App,
      filePath: string,
      key: string,
      callback: () => Promise<void>
    ) => {
  return new Promise<void>((resolve) => {
    let inProgress = false;
    const onChanged = async (file: any) => {
      if (inProgress) return;
      console.log("File changed:", file.path, "looking for:", filePath, "and key:", key);
      if (file.path !== filePath) return;

      const meta = app.metadataCache.getFileCache(file);
      console.log("Metadata for file:", meta, "looking for key:", key);
      if (!meta || !meta.frontmatter || !(key in meta.frontmatter)) return;

      inProgress = true;
      app.metadataCache.off('changed', onChanged);

      // Petite pause pour s'assurer que la cache est bien à jour
      await new Promise(res => setTimeout(res, 100));
      await callback();

      resolve();
    };
    app.metadataCache.on('changed', onChanged);
  });
};

export const waitForMetaDataCacheUpdate = async (app: App, callback: () => Promise<void>) => {
  return new Promise<void>((resolve) => {
    let inProgress = false;
    const onResolved = async () => {
      if (inProgress) return;
      inProgress = true;
      app.metadataCache.off('resolved', onResolved);

      // Wait a bit to ensure cache is fully updated
      await new Promise(res => setTimeout(res, 100));
      // Wait for the callback to finish
      await callback();

      resolve();
    };
    app.metadataCache.on('resolved', onResolved);

  });
};

