import { App, Modal, Notice, Setting, TextAreaComponent, ToggleComponent } from 'obsidian';
import { EmailThreadParser, EmailIngestionService, ParsedEmail, Vault } from 'markdown-crm';
import { ClassFileModals } from './Modals';
import { ObsidianApp } from '../App';

/**
 * Modal de capture d'emails :
 *   1. Coller le contenu brut d'un fil (un ou plusieurs mails, citations comprises)
 *   2. "Analyser" : le fil est segmenté, les adresses ET les noms sont
 *      rattachés aux fichiers du vault (Personne / Commune / Institution -
 *      une adresse ou un nom de Commercial est ignoré pour la cible, c'est
 *      "nous") ; le choix manuel d'une fiche reste toujours possible
 *      (rapprochement auto impossible quand le nom diffère ou que la fiche
 *      n'a pas d'email) ; aucune correspondance -> création proposée AVEC
 *      validation
 *   3. Prévisualisation (date, expéditeur, description, cases à cocher) puis
 *      "Enregistrer" : entrées `suivie` fusionnées, triées, dédupliquées et
 *      écrites en UNE passe
 */
export class EmailCaptureModal extends Modal {
    private emails: ParsedEmail[] = [];
    private targets: any[] = [];
    private selectedTarget: any = null;
    private includedFlags: boolean[] = [];
    private resultSection: HTMLElement | null = null;

    constructor(
        app: App,
        private vault: Vault,
        private settings: any,
        private obsidianApp: ObsidianApp
    ) {
        super(app);
    }

    onOpen(): void {
        this.render();
    }

    private render(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Enregistrer des emails' });

        new Setting(contentEl)
            .setName('Contenu du fil')
            .setDesc("Collez le contenu brut du ou des mails (citations comprises). Formats reconnus : entêtes From/Date/Subject (Gmail, Thunderbird), citations Gmail FR/EN, messages transférés.");

        const textArea = new TextAreaComponent(contentEl);
        textArea.inputEl.style.width = '100%';
        textArea.inputEl.style.height = '180px';

        new Setting(contentEl)
            .addButton((button) => {
                button
                    .setButtonText('Analyser')
                    .setCta()
                    .onClick(async () => {
                        await this.analyze(textArea.inputEl.value);
                    });
            });

        this.resultSection = contentEl.createDiv();
    }

    private async analyze(raw: string): Promise<void> {
        this.emails = EmailThreadParser.parse(raw);
        this.targets = [];
        this.selectedTarget = null;
        const section = this.resultSection;
        if (!section) { return; }
        section.empty();

        if (this.emails.length === 0) {
            new Notice('Aucun email détecté dans le texte collé.');
            return;
        }

        // Rattachement automatique : adresses puis noms
        const service = new EmailIngestionService(this.vault as any);
        const addresses = new Set<string>();
        for (const email of this.emails) {
            if (email.fromEmail) { addresses.add(email.fromEmail); }
            for (const to of email.toEmails) { addresses.add(to); }
        }
        const targets = new Map<string, any[]>();
        for (const address of addresses) {
            const isOwn = await service.isOwnAddress(address);
            if (isOwn) {
                // Une adresse d'un Commercial, c'est nous : la cible est l'autre partie
                continue;
            }
            const files = await service.findFilesByEmail(address);
            for (const file of files) {
                const key = file.getPath?.() ?? file.getName?.();
                if (!targets.has(key)) { targets.set(key, file); }
            }
        }
        // Repli par nom : les fils réels citent souvent l'auteur sans adresse
        // ("Le 28/01/2026 à 07:49, école du Village a écrit :")
        const names = new Set<string>();
        for (const email of this.emails) {
            if (email.fromName) { names.add(email.fromName); }
        }
        for (const name of names) {
            const isOwn = await service.isOwnName(name);
            if (isOwn) { continue; }
            const files = await service.findFilesByName(name);
            for (const file of files) {
                const key = file.getPath?.() ?? file.getName?.();
                if (!targets.has(key)) { targets.set(key, file); }
            }
        }
        this.targets = [...targets.values()];
        this.includedFlags = this.emails.map(() => true);

        this.renderAnalysis(section);
    }

    private renderAnalysis(section: HTMLElement): void {
        section.empty();

        new Setting(section).setName(
            this.emails.length === 1 ? '1 mail détecté.' : `${this.emails.length} mails détectés.`
        );

        if (this.targets.length === 0) {
            this.offerPersonneCreation(section);
        }

        this.renderTargetSelector(section);
        this.renderEmailList(section);
        this.renderSaveButton(section);
    }

    /**
     * Aucune adresse/nom du fil ne correspond à une fiche : proposer la
     * création d'une Personne à partir de l'expéditeur, AVEC validation
     * explicite. Le sélecteur manuel ci-dessous reste la porte de sortie.
     */
    private offerPersonneCreation(section: HTMLElement): void {
        const sender = this.emails.find((e) => e.fromEmail) ?? this.emails[0];
        const name = sender?.fromName || sender?.fromEmail || 'Nouveau contact';

        new Setting(section)
            .setName('Aucune fiche trouvée automatiquement')
            .setDesc(`Aucune adresse/nom du fil ne correspond à une fiche. Créer « ${name} » (${sender?.fromEmail ?? 'sans adresse'}) ? Sinon, choisissez une fiche existante ci-dessous.`)
            .addButton((button) => {
                button
                    .setButtonText('Créer la personne')
                    .setCta()
                    .onClick(async () => {
                        try {
                            const personneClasse = (this.vault as any).getClasseFromName?.('Personne');
                            const createdFile = await (this.vault as any).createFile(
                                personneClasse ?? null,
                                name,
                                { properties: { email: sender?.fromEmail ?? '' } }
                            );
                            if (!createdFile?.file) {
                                new Notice('Création annulée.');
                                return;
                            }
                            const classe = await (this.vault as any).getFromFile(createdFile.file as any);
                            if (!classe) {
                                new Notice("La personne a été créée mais n'a pas pu être chargée.");
                                return;
                            }
                            this.targets = [classe];
                            this.selectedTarget = classe;
                            this.renderAnalysis(section);
                        } catch (error) {
                            new Notice(`Erreur lors de la création : ${error instanceof Error ? error.message : error}`);
                        }
                    });
            });
    }

    /**
     * Cible : détectée automatiquement (choix par dropdown si plusieurs),
     * et toujours corrigeable via le sélecteur manuel.
     */
    private renderTargetSelector(container: HTMLElement): void {
        if (this.selectedTarget && !this.targets.includes(this.selectedTarget)) {
            this.targets = [this.selectedTarget, ...this.targets];
        }
        if (!this.selectedTarget && this.targets.length > 0) {
            this.selectedTarget = this.targets[0];
        }

        const setting = new Setting(container).setName('Fichier cible');
        if (this.selectedTarget) {
            setting.setDesc(`${this.selectedTarget.getName()} (${this.selectedTarget.getClassName?.() ?? ''})`);
        } else {
            setting.setDesc('Choisissez la fiche sur laquelle enregistrer le fil.');
        }

        if (this.targets.length > 1) {
            const dropdown = setting.controlEl.createEl('select');
            this.targets.forEach((target, index) => {
                const option = dropdown.createEl('option');
                option.value = String(index);
                option.textContent = `${target.getName()} (${target.getClassName?.() ?? ''})`;
            });
            dropdown.value = String(this.targets.indexOf(this.selectedTarget));
            dropdown.addEventListener('change', () => {
                this.selectedTarget = this.targets[Number(dropdown.value)];
            });
        }

        setting.addButton((button) => {
            button
                .setButtonText('Choisir une fiche...')
                .onClick(async () => {
                    await this.pickTargetManually();
                });
        });
    }

    /**
     * Recherche manuelle d'une fiche (toutes classes de suivi) : le repli
     * universel quand le rapprochement automatique échoue.
     */
    private async pickTargetManually(): Promise<void> {
        const section = this.resultSection;
        if (!section) { return; }
        const modals = new ClassFileModals(
            this.app as any,
            this.vault as any,
            this.obsidianApp,
            async () => {}
        );
        await modals.openClassFileSuggester(
            ['Personne', 'Commune', 'Institution'],
            async (file: any) => {
                if (!file) { return; }
                const classe = await (this.vault as any).getFromFile(file);
                if (!classe) {
                    new Notice("La fiche sélectionnée n'a pas pu être chargée.");
                    return;
                }
                this.selectedTarget = classe;
                this.renderAnalysis(section);
            }
        );
    }

    private renderEmailList(section: HTMLElement): void {
        const listContainer = section.createDiv();
        this.emails.forEach((email, index) => {
            const setting = new Setting(listContainer)
                .setName(`${index + 1}. ${email.fromName ?? email.fromEmail ?? 'Auteur inconnu'}`)
                .setDesc(`${email.date ?? 'sans date'} — ${email.subject ?? '(sans sujet)'}\n${(email.body || '').slice(0, 140)}${(email.body || '').length > 140 ? '…' : ''}`);
            const toggle = new ToggleComponent(setting.controlEl);
            toggle.setValue(this.includedFlags[index]);
            toggle.onChange((value) => { this.includedFlags[index] = value; });
        });
    }

    private renderSaveButton(section: HTMLElement): void {
        new Setting(section).addButton((button) => {
            button
                .setButtonText(
                    this.selectedTarget
                        ? `Enregistrer dans ${this.selectedTarget.getName()}`
                        : 'Enregistrer'
                )
                .setCta()
                .onClick(async () => {
                    await this.save();
                });
        });
    }

    private async save(): Promise<void> {
        if (!this.selectedTarget) {
            new Notice('Choisissez un fichier cible.');
            return;
        }
        const selected = this.emails.filter((_, index) => this.includedFlags[index]);
        if (selected.length === 0) {
            new Notice('Aucun email sélectionné.');
            return;
        }
        const service = new EmailIngestionService(this.vault as any);
        const interlocuteur = this.settings?.defaultCommercial
            ? `[[${this.settings.defaultCommercial}]]`
            : undefined;
        try {
            const result = await service.ingest(this.selectedTarget, selected, { interlocuteur });
            new Notice(result.added > 0
                ? `${result.added} entrée(s) ajoutée(s) à ${this.selectedTarget.getName()}${result.skipped > 0 ? `, ${result.skipped} déjà enregistrée(s)` : ''}`
                : `Rien à ajouter : ${result.skipped} entrée(s) déjà enregistrée(s) sur ${this.selectedTarget.getName()}.`);
            this.close();
        } catch (error) {
            new Notice(`Erreur lors de l'enregistrement : ${error instanceof Error ? error.message : error}`);
        }
    }
}
