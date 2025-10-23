import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // Base configuration
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  
  // Performance optimizations
  maxWorkers: '50%', // Use half of available CPU cores
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Test discovery and execution
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/Classes.test.js',
    '/__tests__/File.test.js'
  ],
  
  // Module resolution
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
    '^Utils/Modals/Modals$': '<rootDir>/__mocks__/Utils/Modals/Modals.ts',
    '^Utils/Properties/MediaProperty$': '<rootDir>/__mocks__/Utils/Properties/MediaProperty.ts',
    '^Utils/Properties/ObjectProperty$': '<rootDir>/Utils/Properties/ObjectProperty.ts',
    '^Utils/(.*)$': '<rootDir>/Utils/$1',
    '^Classes/(.*)$': '<rootDir>/Classes/$1',
    '^three/examples/jsm/loaders/GLTFLoader\\.js$': '<rootDir>/__mocks__/three/examples/jsm/loaders/GLTFLoader.js',
    '^three/examples/jsm/controls/OrbitControls\\.js$': '<rootDir>/__mocks__/three/examples/jsm/controls/OrbitControls.js',
    '^three$': '<rootDir>/__mocks__/three.js',
    '^electron$': '<rootDir>/__mocks__/electron.js'
  },
  
  // TypeScript transformation
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
      useESM: false,
      // Skip type checking for faster compilation
      diagnostics: {
        ignoreCodes: [1343]
      },
      // Use faster compiler options
      tsconfig: {
        sourceMap: true,
        inlineSourceMap: true,
        declarationMap: false
      }
    }]
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(three|@types))'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest-config/setupGlobal.ts'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Timeouts and performance
  testTimeout: 5000, // Reduced from 10000ms for faster feedback
  
  // Coverage settings (disabled by default for speed)
  collectCoverage: false,
  collectCoverageFrom: [
    'Utils/**/*.ts',
    'Classes/**/*.ts',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],
  
  // Reduce noise in output
  verbose: false,
  silent: false,
  
  // Watch mode optimization
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.git/',
    '<rootDir>/data/'
  ],
  
  // Error handling
  errorOnDeprecated: false,
  bail: false, // Don't stop on first failure in watch mode
  
  // Module handling
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/.cache'
  ],
  
  // Clear mocks between tests for consistency
  clearMocks: true,
  restoreMocks: true
};

export default config;