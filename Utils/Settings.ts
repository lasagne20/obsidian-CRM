export interface Settings {
  templateFolder: string;
  personalName : string;
  dataFile: string;
  additionalFiles : {[key : string] : string}[]
}
