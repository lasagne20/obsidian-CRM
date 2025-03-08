const fs = require('fs');


export class GenerativeData {
    private data: any;
    public className : string;
    public subClassName : string;

    constructor(className: string, subClassName: string, path: string) {
        this.data = this.readJsonFile(path);
        this.className = className;
        this.subClassName = subClassName;
    }

    private readJsonFile(path: string): any {
        try {
            const rawData = fs.readFileSync(path, 'utf8');
            return JSON.parse(rawData);
        } catch (error) {
            console.error(`Error reading JSON file from path: ${path}`, error);
            return null;
        }
    }

    

}