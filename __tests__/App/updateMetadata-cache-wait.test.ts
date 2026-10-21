/**
 * Attente de la mise à jour du metadataCache après écriture du frontmatter.
 *
 * Bug : processFrontMatter écrit le fichier mais le metadataCache re-parse le
 * fichier de façon ASYNCHRONE. Toutes les lectures faites juste après
 * (RenameFileAction via TemplateEngine, propriétés dérivées) voyaient donc
 * l'ANCIEN frontmatter : le rename du titre était systématiquement en retard
 * d'un cran ("Filename already correct, skipping").
 *
 * updateMetadata doit attendre l'événement metadataCache 'changed' du fichier
 * (avec timeout de sécurité) avant de rendre la main.
 */

import { App, TFile } from 'obsidian';
import { ObsidianApp } from '../../src/App';
import { IFile } from 'markdown-crm';

describe('ObsidianApp.updateMetadata - attente du metadataCache', () => {
    let metadataCache: any;
    let mockApp: jest.Mocked<App>;
    let obsidianApp: ObsidianApp;
    let mockFile: TFile;
    const iFile: IFile = {
        path: 'test.md',
        basename: 'test',
        extension: 'md',
        name: 'test.md',
    } as any;

    /** Minimal EventEmitter-style metadataCache mock */
    const buildMetadataCache = () => {
        const handlers: Record<string, Function[]> = {};
        return {
            on: (event: string, cb: Function) => {
                (handlers[event] = handlers[event] || []).push(cb);
            },
            off: (event: string, cb: Function) => {
                const list = handlers[event] || [];
                const index = list.indexOf(cb);
                if (index >= 0) list.splice(index, 1);
            },
            emit: (event: string, file: any) => {
                (handlers[event] || []).slice().forEach(cb => cb(file));
            }
        };
    };

    beforeEach(() => {
        metadataCache = buildMetadataCache();

        mockFile = Object.create(TFile.prototype);
        Object.assign(mockFile, {
            path: 'test.md',
            basename: 'test',
            extension: 'md',
            name: 'test.md',
        });

        mockApp = {
            vault: {
                getAbstractFileByPath: jest.fn().mockReturnValue(mockFile),
            },
            fileManager: {
                processFrontMatter: jest.fn((_file: any, callback: (fm: any) => void) => {
                    callback({});
                    return Promise.resolve();
                }),
            },
            metadataCache,
        } as any;

        obsidianApp = new ObsidianApp(mockApp);
    });

    it('PLANTE : ne résout pas avant l\'événement metadataCache "changed" du fichier', async () => {
        let resolved = false;
        const promise = obsidianApp.updateMetadata(iFile, { etat: 'Payé' } as any)
            .then(() => { resolved = true; });

        // processFrontMatter a résolu, mais l'événement 'changed' n'est pas encore émis
        await new Promise(r => setTimeout(r, 10));
        expect(resolved).toBe(false);

        metadataCache.emit('changed', { path: 'test.md' });
        await promise;
        expect(resolved).toBe(true);
    });

    it('ignore l\'événement "changed" d\'un autre fichier', async () => {
        let resolved = false;
        const promise = obsidianApp.updateMetadata(iFile, { etat: 'Payé' } as any)
            .then(() => { resolved = true; });

        await new Promise(r => setTimeout(r, 10));

        // Un autre fichier est re-indexé : ne doit pas débloquer l'attente
        metadataCache.emit('changed', { path: 'other.md' });
        await new Promise(r => setTimeout(r, 10));
        expect(resolved).toBe(false);

        metadataCache.emit('changed', { path: 'test.md' });
        await promise;
        expect(resolved).toBe(true);
    });

    it('résout au timeout de sécurité si aucun événement n\'arrive', async () => {
        jest.useFakeTimers();
        try {
            let resolved = false;
            const promise = obsidianApp.updateMetadata(iFile, { etat: 'Payé' } as any)
                .then(() => { resolved = true; });

            // Au-delà du timeout de sécurité (1000ms), l'attente doit se lever
            await jest.advanceTimersByTimeAsync(2000);
            await promise;
            expect(resolved).toBe(true);
        } finally {
            jest.useRealTimers();
        }
    });

    it('ne casse pas sans metadataCache (environnements de test)', async () => {
        (mockApp as any).metadataCache = undefined;
        await expect(obsidianApp.updateMetadata(iFile, { etat: 'Payé' } as any))
            .resolves.toBeUndefined();
    });
});
