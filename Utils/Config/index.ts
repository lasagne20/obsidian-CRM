// Configuration System Exports
export type { ClassConfig, PropertyConfig, SelectOption, DisplayContainer, SubClassConfig } from './interfaces';
export { ConfigLoader } from './ConfigLoader';
export { ClassConfigManager } from './ClassConfigManager';
export { DynamicClassFactory } from './DynamicClassFactory';
export { ConfigMigrationTester } from './ConfigMigrationTester';

// Utility Exports
export { VaultClassAdapter } from '../VaultClassAdapter';

// Re-export base classes (unchanged)
export { Classe } from '../../Classes/Classe';
export { SubClass } from '../../Classes/SubClasses/SubClass';