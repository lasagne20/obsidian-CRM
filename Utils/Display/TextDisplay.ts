export class TextDisplay {
    private text: string;

    constructor(text: string) {
        this.text = text;
    }

    public getDisplay(): HTMLElement {
        const el = document.createElement('div');
        el.textContent = this.text;
        el.style.fontSize = '2rem';
        el.style.fontWeight = 'bold';
        el.style.margin = '1em 0';
        el.style.textAlign = 'center';
        return el;
    }
}