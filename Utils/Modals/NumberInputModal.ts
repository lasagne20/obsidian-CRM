import { Modal, App, Setting } from "obsidian";

export class NumberInputModal extends Modal {
    private onSubmit: (input: number) => void;
    private placeholder: string;

    constructor(app: App, placeholder: string, onSubmit: (input: number) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.placeholder = placeholder;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        new Setting(contentEl)
            .setName("Entrer un nombre")
            .addText(text => 
                text.setPlaceholder(this.placeholder)
                    .onChange(value => {
                        const numberValue = Number(value);
                        if (!isNaN(numberValue)) {
                            this.onSubmit(numberValue);
                        }
                    })
            );
    }
}