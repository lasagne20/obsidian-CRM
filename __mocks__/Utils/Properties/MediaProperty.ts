// Mock for Utils/Properties/MediaProperty
export class MediaProperty {
    public type: string = 'media';
    public name: string;
    
    constructor(name: string, args: any = {}) {
        this.name = name;
    }
    
    getDefaultValue() {
        return '';
    }
    
    fillDisplay() {
        return {
            tagName: 'DIV',
            className: '',
            textContent: '',
            appendChild: jest.fn(),
            querySelector: jest.fn(() => null),
            classList: {
                add: jest.fn(),
                contains: jest.fn(() => true)
            }
        };
    }
    
    read() {
        return '';
    }
}