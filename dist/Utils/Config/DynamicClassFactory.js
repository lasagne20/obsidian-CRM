"use strict";
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
exports.DynamicClassFactory = void 0;
var ClassConfigManager_1 = require("./ClassConfigManager");
var DynamicClassFactory = /** @class */ (function () {
    function DynamicClassFactory(configPath, app) {
        this.classRegistry = new Map();
        this.configManager = new ClassConfigManager_1.ClassConfigManager(configPath, app);
    }
    DynamicClassFactory.getInstance = function (configPath, app) {
        if (!DynamicClassFactory.instance) {
            if (!configPath) {
                throw new Error('ConfigPath required for first initialization');
            }
            DynamicClassFactory.instance = new DynamicClassFactory(configPath, app);
        }
        return DynamicClassFactory.instance;
    };
    /**
     * Get or create a dynamic class by name
     */
    DynamicClassFactory.prototype.getClass = function (className) {
        return __awaiter(this, void 0, void 0, function () {
            var dynamicClass;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.classRegistry.has(className)) {
                            return [2 /*return*/, this.classRegistry.get(className)];
                        }
                        return [4 /*yield*/, this.configManager.createDynamicClasse(className)];
                    case 1:
                        dynamicClass = _a.sent();
                        this.classRegistry.set(className, dynamicClass);
                        return [2 /*return*/, dynamicClass];
                }
            });
        });
    };
    /**
     * Create an instance of a class from a file
     */
    DynamicClassFactory.prototype.createInstance = function (className, app, vault, file) {
        return __awaiter(this, void 0, void 0, function () {
            var ClassConstructor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getClass(className)];
                    case 1:
                        ClassConstructor = _a.sent();
                        return [2 /*return*/, new ClassConstructor(app, vault, file)];
                }
            });
        });
    };
    /**
     * Get all available class names
     */
    DynamicClassFactory.prototype.getAvailableClasses = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.configManager.getAvailableClasses()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Clear cache and reload configurations
     */
    DynamicClassFactory.prototype.clearCache = function () {
        this.configManager.clearCache();
        this.classRegistry.clear();
    };
    /**
     * Initialize the factory with the plugin's config path
     */
    DynamicClassFactory.initialize = function (pluginPath, app) {
        return __awaiter(this, void 0, void 0, function () {
            var configPath;
            return __generator(this, function (_a) {
                configPath = "".concat(pluginPath, "/config");
                return [2 /*return*/, DynamicClassFactory.getInstance(configPath, app)];
            });
        });
    };
    return DynamicClassFactory;
}());
exports.DynamicClassFactory = DynamicClassFactory;
