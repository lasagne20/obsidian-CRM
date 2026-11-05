import { App, Modal, Notice, Setting, TextAreaComponent, ToggleComponent } from 'obsidian';
import { EmailThreadParser, EmailIngestionService, ParsedEmail, Vault } from 'markdown-crm';

/**
 * Modal de capture d'emails :
 *   1. Coller le contenu brut d'un fil (un ou plusieurs mails, citations comprises)
 *   2. "Analyser" : le fil est segmenté, les adresses sont rattachées aux
 *      fichiers du vault (Personne / Commune / Institution - une adresse d'un
 *      Commercial est ignorée pour la cible, c'est "nous") ; ambiguïté ->
 *      choix ; aucune correspondance -> création d'une Personne proposée AVEC
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
        private settings: any
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
            .setDesc("Collez le contenu brut du ou des mails (citations comprises). Formats reconnus : entêtes From/Date/Subject, citations Gmail FR/EN, messages transférés.");

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
        const section = this.resultSection;
        if (!section) { return; }
        section.empty();

        if (this.emails.length === 0) {
            new Notice('Aucun email détecté dans le texte collé.');
            return;
        }

        // Rattachement : toutes les adresses du fil vers les fichiers du vault
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
        this.targets = [...targets.values()];
        this.includedFlags = this.emails.map(() => true);

        new Setting(section).setName(
            this.emails.length === 1 ? '1 mail détecté.' : `${this.emails.length} mails détectés.`
        );

        if (this.targets.length === 0) {
            await this.offerPersonneCreation(section);
            return;
        }

        if (this.targets.length === 1) {
            this.selectedTarget = this.targets[0];
            new Setting(section)
                .setName('Fichier cible')
                .setDesc(`${this.selectedTarget.getName()} (${this.selectedTarget.getClassName?.() ?? ''})`);
        } else {
            this.selectedTarget = this.targets[0];
            const setting = new Setting(section)
                .setName('Fichier cible')
                .setDesc('Plusieurs fichiers correspondent aux adresses du fil.');
            const dropdown = setting.controlEl.createEl('select');
            this.targets.forEach((target, index) => {
                const option = dropdown.createEl('option');
                option.value = String(index);
                option.textContent = `${target.getName()} (${target.getClassName?.() ?? ''})`;
            });
            dropdown.addEventListener('change', () => {
                this.selectedTarget = this.targets[Number(dropdown.value)];
            });
        }

        this.renderEmailList(section);
        this.renderSaveButton(section);
    }

    /**
     * Aucune adresse du fil ne correspond à un fichier : proposer la création
     * d'une Personne à partir de l'expéditeur, AVEC validation explicite.
     */
    private async offerPersonneCreation(section: HTMLElement): Promise<void> {
        const sender = this.emails.find((e) => e.fromEmail);
        const name = sender?.fromName || sender?.fromEmail || 'Nouveau contact';

        const confirmSetting = new Setting(section)
            .setName('Créer une nouvelle personne ?')
            .setDesc(`Aucun de vos Personnes/Communes/Institutions ne correspond aux adresses du fil. Créer « ${name} » (${sender?.fromEmail ?? 'sans adresse'}) puis enregistrer le fil sur sa fiche ?`);
        confirmSetting.addButton((button) => {
            button
                .setButtonText('Créer et enregistrer')
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
                        this.selectedTarget = classe;
                        section.empty();
                        this.renderEmailList(section);
                        this.renderSaveButton(section);
                    } catch (error) {
                        new Notice(`Erreur lors de la création : ${error instanceof Error ? error.message : error}`);
                    }
                });
        });
        confirmSetting.addButton((button) => {
            button
                .setButtonText('Ne pas créer')
                .onClick(() => {
                    this.renderEmailList(section);
                });
        });
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
