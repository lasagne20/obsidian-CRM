/**
 * Interfaces partagées pour éviter les références circulaires
 * entre Property, Classe et SubClass
 */

// Interface pour les objets qui peuvent être lus par les propriétés
export interface IReadable {
    readProperty(name: string): any;
    updateMetadata(name: string, value: any): Promise<void>;
}

// Interface pour les classes CRM
export interface IClasse extends IReadable {
    getClasse(): string;
    vault?: any;
}

// Interface pour les sous-classes
export interface ISubClass extends IReadable {
    getClasse(): string;
}

// Interface pour les lignes de tableau CSV dans les configurations YAML
export interface PropertyTableRow {
    name: string;
    type: string;
    icon: string;
    default: string;
    classes?: string;
    options?: string;
    formula?: string;
    display?: string;
}

// Interface pour la configuration de propriété traditionnelle
export interface PropertyConfig {
    type: string;
    name: string;
    icon?: string;
    defaultValue?: string;
    classes?: string[];
    options?: { name: string; color: string }[];
    formula?: string;
    display?: string;
}

// Type union pour les objets acceptés par Property
export type PropertyFile = IClasse | ISubClass | any; // any pour File qui a une structure différente