export class TFile {
    constructor(public path: string, public name: string) {}
  }
  
  export class App {
    vault = {
      getAbstractFileByPath: jest.fn(),
      createFolder: jest.fn(),
    };
    metadataCache = {
      on: jest.fn(),
      off: jest.fn(),
    };
  }
  