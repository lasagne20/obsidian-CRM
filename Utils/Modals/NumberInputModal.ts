import { Modal, Setting } from "../App";
import AppShim from "../App";

export class NumberInputModal extends Modal {
    private onSubmit: (input: number) => void;
    private placeholder: string;

    constructor(app: AppShim, placeholder: string, onSubmit: (input: number) => void) {
        super(app.realObsidianApp || app as any);
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
                    .onChange((value: any) => {
                        const numberValue = Number(value);
                        if (!isNaN(numberValue)) {
                            this.onSubmit(numberValue);
                        }
                    })
            );
    }
}