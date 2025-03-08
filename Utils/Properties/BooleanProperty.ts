import { MyVault } from 'Utils/MyVault';
import { Property } from './Property';
import { setIcon } from 'obsidian';

export class BooleanProperty extends Property {

    constructor(name: string, icon: string = "align-left", staticProperty: boolean = false) {
        super(name, icon, staticProperty)
    }

     fillDisplay(vault: MyVault, value: any, update: (value: any) => Promise<void>) {
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