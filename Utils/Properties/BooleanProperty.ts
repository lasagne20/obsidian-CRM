import { MyVault } from 'Utils/MyVault';
import { Property } from './Property';
import { setIcon } from 'obsidian';

export class BooleanProperty extends Property {

    public type : string = "boolean";

    constructor(name: string, args = {}) {
        super(name, args);
    }

     fillDisplay(vault : any, value: any, update: (value: any) => Promise<void>) {
            this.vault = vault;
            const container = document.createElement('div');
            const button = document.createElement('span');
            setIcon(button, this.icon)

            const updateButtonState = () => {
                if (value) {
                    button.classList.add('boolean-property-button-active');
                } else {
                    button.classList.remove('boolean-property-button-active');
                }
            };
            updateButtonState();

            if (!this.static) {
                button.addEventListener('click', async () => {
                    value = !value;
                    updateButtonState();
                    await update(value);
                });
            } else {
                
            }

            container.appendChild(button);
            return container;
        }
}