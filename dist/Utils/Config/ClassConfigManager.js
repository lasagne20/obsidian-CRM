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
exports.ClassConfigManager = void 0;
var ConfigLoader_1 = require("./ConfigLoader");
var Classe_1 = require("../../Classes/Classe");
var ClassConfigManager = /** @class */ (function () {
    function ClassConfigManager(configPath, app) {
        this.loadedClasses = new Map();
        this.configLoader = new ConfigLoader_1.ConfigLoader(configPath, app);
    }
    /**
     * Create a dynamic Classe from configuration
     */
    ClassConfigManager.prototype.createDynamicClasse = function (className) {
        return __awaiter(this, void 0, void 0, function () {
            var config, DynamicClasse, _i, _a, _b, key, propConfig;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.loadedClasses.has(className)) {
                            return [2 /*return*/, this.loadedClasses.get(className)];
                        }
                        return [4 /*yield*/, this.configLoader.loadClassConfig(className)];
                    case 1:
                        config = _c.sent();
                        DynamicClasse = /** @class */ (function (_super) {
                            __extends(DynamicClasse, _super);
                            function DynamicClasse(app, vault, file) {
                                return _super.call(this, app, vault, file) || this;
                            }
                            DynamicClasse.getConstructor = function () {
                                return DynamicClasse;
                            };
                            DynamicClasse.prototype.getConstructor = function () {
                                return DynamicClasse;
                            };
                            DynamicClasse.prototype.populate = function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        return [2 /*return*/];
                                    });
                                });
                            };
                            DynamicClasse.prototype.getTopDisplayContent = function () {
                                var container = document.createElement("div");
                                if (config.display && config.display.containers) {
                                    for (var _i = 0, _a = config.display.containers; _i < _a.length; _i++) {
                                        var containerConfig = _a[_i];
                                        var displayContainer = this.createDisplayContainer(containerConfig);
                                        container.appendChild(displayContainer);
                                    }
                                }
                                else {
                                    // Default display: show all properties
                                    var properties = document.createElement("div");
                                    for (var _b = 0, _c = Object.values(this.getProperties()); _b < _c.length; _b++) {
                                        var property = _c[_b];
                                        properties.appendChild(property.getDisplay(this));
                                    }
                                    container.appendChild(properties);
                                }
                                return container;
                            };
                            DynamicClasse.prototype.createDisplayContainer = function (containerConfig) {
                                var container = document.createElement("div");
                                if (containerConfig.className) {
                                    container.classList.add(containerConfig.className);
                                }
                                // Add CSS class based on container type
                                switch (containerConfig.type) {
                                    case 'line':
                                        container.classList.add("metadata-line");
                                        break;
                                    case 'column':
                                        container.classList.add("metadata-column");
                                        break;
                                }
                                if (containerConfig.title) {
                                    var title = document.createElement("div");
                                    title.textContent = containerConfig.title;
                                    title.classList.add("metadata-title");
                                    container.appendChild(title);
                                }
                                // Add properties to container
                                for (var _i = 0, _a = containerConfig.properties; _i < _a.length; _i++) {
                                    var propName = _a[_i];
                                    var property = this.getAllProperties()[propName];
                                    if (property) {
                                        container.appendChild(property.getDisplay(this));
                                    }
                                }
                                return container;
                            };
                            DynamicClasse.className = config.className;
                            DynamicClasse.classIcon = config.classIcon;
                            DynamicClasse.Properties = {};
                            return DynamicClasse;
                        }(Classe_1.Classe));
                        // Initialize static properties
                        if (config.parentProperty) {
                            DynamicClasse.parentProperty = this.configLoader.createProperty(config.parentProperty);
                        }
                        if (config.subClassesProperty) {
                            DynamicClasse.subClassesProperty = this.configLoader.createSubClassProperty(config, DynamicClasse);
                        }
                        // Initialize all properties
                        for (_i = 0, _a = Object.entries(config.properties); _i < _a.length; _i++) {
                            _b = _a[_i], key = _b[0], propConfig = _b[1];
                            if (propConfig.type === 'SubClassProperty' && config.subClassesProperty) {
                                // Use the subClassesProperty instead
                                DynamicClasse.Properties[key] = DynamicClasse.subClassesProperty;
                            }
                            else {
                                DynamicClasse.Properties[key] = this.configLoader.createProperty(propConfig);
                            }
                        }
                        this.loadedClasses.set(className, DynamicClasse);
                        return [2 /*return*/, DynamicClasse];
                }
            });
        });
    };
    /**
     * Get all available class names
     */
    ClassConfigManager.prototype.getAvailableClasses = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.configLoader.getAllClassNames()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Clear the cache and reload configurations
     */
    ClassConfigManager.prototype.clearCache = function () {
        this.loadedClasses.clear();
    };
    return ClassConfigManager;
}());
exports.ClassConfigManager = ClassConfigManager;
