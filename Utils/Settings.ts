export interface Settings {
  templateFolder: string;
  personalName : string;
  dataFile: string;
  additionalFiles : {[key : string] : string}[];
  configPath?: string; // Path to YAML configuration files
}
