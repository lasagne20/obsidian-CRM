"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.ConfigLoader = void 0;
var yaml = require("js-yaml");
var Property_1 = require("../Properties/Property");
var FileProperty_1 = require("../Properties/FileProperty");
var MultiFileProperty_1 = require("../Properties/MultiFileProperty");
var SelectProperty_1 = require("../Properties/SelectProperty");
var MultiSelectProperty_1 = require("../Properties/MultiSelectProperty");
var EmailProperty_1 = require("../Properties/EmailProperty");
var PhoneProperty_1 = require("../Properties/PhoneProperty");
var LinkProperty_1 = require("../Properties/LinkProperty");
var ObjectProperty_1 = require("../Properties/ObjectProperty");
var RatingProperty_1 = require("../Properties/RatingProperty");
var DateProperty_1 = require("../Properties/DateProperty");
var RangeDateProperty_1 = require("../Properties/RangeDateProperty");
var AdressProperty_1 = require("../Properties/AdressProperty");
var ClasseProperty_1 = require("../Properties/ClasseProperty");
var SubClassProperty_1 = require("../Properties/SubClassProperty");
var TextProperty_1 = require("../Properties/TextProperty");
var BooleanProperty_1 = require("../Properties/BooleanProperty");
var NumberProperty_1 = require("../Properties/NumberProperty");
var MediaProperty_1 = require("../Properties/MediaProperty");
var FormulaProperty_1 = require("../Properties/FormulaProperty");
var SubClass_1 = require("../../Classes/SubClasses/SubClass");
// Remove Node.js imports for Obsidian compatibility
// import { readFileSync } from 'fs';
// import { join } from 'path';
var ConfigLoader = /** @class */ (function () {
    function ConfigLoader(configPath, app) {
        this.loadedConfigs = new Map();
        this.configPath = configPath;
        this.app = app;
    }
    /**
     * Load a class configuration from YAML file
     */
    ConfigLoader.prototype.loadClassConfig = function (className) {
        return __awaiter(this, void 0, void 0, function () {
            var configFilePath, fileContent, file, config, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.loadedConfigs.has(className)) {
                            return [2 /*return*/, this.loadedConfigs.get(className)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        configFilePath = "".concat(this.configPath, "/").concat(className, ".yaml");
                        fileContent = void 0;
                        if (!(this.app && this.app.vault)) return [3 /*break*/, 3];
                        file = this.app.vault.getAbstractFileByPath(configFilePath);
                        if (!file || !('extension' in file)) {
                            throw new Error("Configuration file not found: ".concat(configFilePath));
                        }
                        return [4 /*yield*/, this.app.vault.read(file)];
                    case 2:
                        fileContent = _a.sent();
                        return [3 /*break*/, 4];
                    case 3: 
                    // Fallback for testing or when app is not available
                    throw new Error('Obsidian app instance required to read configuration files');
                    case 4:
                        config = yaml.load(fileContent);
                        this.loadedConfigs.set(className, config);
                        return [2 /*return*/, config];
                    case 5:
                        error_1 = _a.sent();
                        console.error("Failed to load config for class ".concat(className, ":"), error_1);
                        throw new Error("Configuration not found for class: ".concat(className));
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a Property instance from configuration
     */
    ConfigLoader.prototype.createProperty = function (config) {
        var options = config.icon ? { icon: config.icon } : {};
        switch (config.type) {
            case 'Property':
                return new Property_1.Property(config.name, options);
            case 'FileProperty':
                return new FileProperty_1.FileProperty(config.name, config.classes || [], options);
            case 'MultiFileProperty':
                return new MultiFileProperty_1.MultiFileProperty(config.name, config.classes || [], options);
            case 'SelectProperty':
                var selectOptions = (config.options || []).map(function (opt) { return ({
                    name: opt.name,
                    color: opt.color || ''
                }); });
                return new SelectProperty_1.SelectProperty(config.name, selectOptions, options);
            case 'MultiSelectProperty':
                var multiSelectOptions = (config.options || []).map(function (opt) { return ({
                    name: opt.name,
                    color: opt.color || ''
                }); });
                return new MultiSelectProperty_1.MultiSelectProperty(config.name, multiSelectOptions, options);
            case 'EmailProperty':
                return new EmailProperty_1.EmailProperty(config.name, options);
            case 'PhoneProperty':
                return new PhoneProperty_1.PhoneProperty(config.name, options);
            case 'LinkProperty':
                return new LinkProperty_1.LinkProperty(config.name, options);
            case 'ObjectProperty':
                var objProperties = {};
                if (config.properties) {
                    for (var _i = 0, _a = Object.entries(config.properties); _i < _a.length; _i++) {
                        var _b = _a[_i], key = _b[0], propConfig = _b[1];
                        objProperties[key] = this.createProperty(propConfig);
                    }
                }
                return new ObjectProperty_1.ObjectProperty(config.name, objProperties, options);
            case 'RatingProperty':
                return new RatingProperty_1.RatingProperty(config.name, options);
            case 'DateProperty':
                var defaultValues = config.defaultValue ? [config.defaultValue] : [];
                return new DateProperty_1.DateProperty(config.name, defaultValues, options);
            case 'RangeDateProperty':
                return new RangeDateProperty_1.RangeDateProperty(config.name, options);
            case 'AdressProperty':
                return new AdressProperty_1.AdressProperty(config.name, options);
            case 'ClasseProperty':
                return new ClasseProperty_1.ClasseProperty(config.name, config.icon || 'box');
            case 'TextProperty':
                return new TextProperty_1.TextProperty(config.name, options);
            case 'BooleanProperty':
                return new BooleanProperty_1.BooleanProperty(config.name, options);
            case 'NumberProperty':
                return new NumberProperty_1.NumberProperty(config.name, '', { icon: config.icon || '', static: true });
            case 'SubClassProperty':
                // This will be handled separately in createSubClassProperty
                return new Property_1.Property(config.name, options); // Placeholder
            case 'MediaProperty':
                return new MediaProperty_1.MediaProperty(config.name, options);
            case 'FormulaProperty':
                var formula = config.defaultValue || '';
                var formulaOptions = config.icon ? { icon: config.icon, static: true, write: true } : { icon: '', static: true, write: true };
                return new FormulaProperty_1.FormulaProperty(config.name, formula, formulaOptions);
            default:
                console.warn("Unknown property type: ".concat(config.type, ", falling back to Property"));
                return new Property_1.Property(config.name, options);
        }
    };
    /**
     * Create SubClass instances from configuration
     */
    ConfigLoader.prototype.createSubClasses = function (config, parentClass) {
        if (!config.subClassesProperty) {
            return [];
        }
        var subClasses = [];
        var configLoader = this; // Reference to the current ConfigLoader instance
        var _loop_1 = function (subClassConfig) {
            // Create a dynamic SubClass
            var DynamicSubClass = /** @class */ (function (_super) {
                __extends(DynamicSubClass, _super);
                function DynamicSubClass(classe, data) {
                    if (data === void 0) { data = null; }
                    var _this = _super.call(this, classe, data) || this;
                    _this.subClassName = subClassConfig.name;
                    _this.subClassIcon = subClassConfig.icon || 'box';
                    // Initialize properties if defined
                    if (subClassConfig.properties && !Object.keys(DynamicSubClass.Properties).length) {
                        for (var _i = 0, _a = Object.entries(subClassConfig.properties); _i < _a.length; _i++) {
                            var _b = _a[_i], key = _b[0], propConfig = _b[1];
                            DynamicSubClass.Properties[key] = configLoader.createProperty(propConfig);
                        }
                    }
                    return _this;
                }
                DynamicSubClass.prototype.getConstructor = function () {
                    return DynamicSubClass;
                };
                DynamicSubClass.Properties = {};
                return DynamicSubClass;
            }(SubClass_1.SubClass));
            subClasses.push(new DynamicSubClass(parentClass));
        };
        for (var _i = 0, _a = config.subClassesProperty.subClasses; _i < _a.length; _i++) {
            var subClassConfig = _a[_i];
            _loop_1(subClassConfig);
        }
        return subClasses;
    };
    /**
     * Create SubClassProperty from configuration
     */
    ConfigLoader.prototype.createSubClassProperty = function (config, parentClass) {
        if (!config.subClassesProperty) {
            return undefined;
        }
        var subClasses = this.createSubClasses(config, parentClass);
        return new SubClassProperty_1.SubClassProperty(config.subClassesProperty.name, subClasses);
    };
    /**
     * Get all available class configurations
     */
    ConfigLoader.prototype.getAllClassNames = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would scan the config directory for .yaml files
                // For now, return a hardcoded list based on existing classes
                return [2 /*return*/, [
                        'Personne', 'Institution', 'Lieu', 'Action', 'Animateur',
                        'Evenement', 'Note', 'Partenariat'
                    ]];
            });
        });
    };
    /**
     * Set the config path (useful when we need to update it)
     */
    ConfigLoader.prototype.setConfigPath = function (configPath) {
        this.configPath = configPath;
    };
    return ConfigLoader;
}());
exports.ConfigLoader = ConfigLoader;
