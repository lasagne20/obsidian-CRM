"use strict";
// /c:/Users/leodu/Documents/1 - Pro/Test plugin obsidian/.obsidian/plugins/obsidian-CRM/Utils/App.ts
// AppShim that uses real Obsidian dependencies for production and provides mocks for testing.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.isTFolder = exports.isTFile = exports.TFileClass = exports.setIcon = exports.Setting = exports.FuzzySuggestModal = exports.Modal = exports.Notice = void 0;
var obsidian_1 = require("obsidian");
exports.Notice = obsidian_1.Notice;
exports.Modal = obsidian_1.Modal;
exports.FuzzySuggestModal = obsidian_1.FuzzySuggestModal;
exports.Setting = obsidian_1.Setting;
exports.setIcon = obsidian_1.setIcon;
// TFile class for test mocking - now exported for compatibility
var TFileClass = /** @class */ (function () {
    function TFileClass(path, name) {
        if (path === void 0) { path = ""; }
        this.path = path;
        this.name = name || path.split("/").pop() || path;
        this.basename = this.name.replace(/\.[^/.]+$/, "");
        this.extension = this.name.includes('.') ? this.name.split('.').pop() || '' : '';
        this.stat = { mtime: Date.now(), ctime: Date.now(), size: 0 };
        this.vault = null;
        this.parent = null;
    }
    TFileClass.createMock = function (overrides) {
        if (overrides === void 0) { overrides = {}; }
        return __assign({ path: "mock/file.md", name: "file.md", basename: "file", extension: "md", stat: { mtime: Date.now(), ctime: Date.now(), size: 0 }, vault: null, parent: null }, overrides);
    };
    return TFileClass;
}());
exports.TFileClass = TFileClass;
// Type guards for checking file types (keep these as they're useful)
function isTFile(file) {
    return file && typeof file === 'object' && 'path' in file && !('children' in file);
}
exports.isTFile = isTFile;
function isTFolder(file) {
    return file && typeof file === 'object' && 'children' in file;
}
exports.isTFolder = isTFolder;
// Classe AppShim qui utilise la vraie App d'Obsidian
var AppShim = /** @class */ (function () {
    function AppShim(realApp) {
        this.realApp = null;
        this.realApp = realApp || null;
        if (this.realApp) {
            // Utiliser la vraie App d'Obsidian - créer des wrappers pour compatibilité
            this.vault = this.createVaultWrapper(this.realApp.vault);
            this.workspace = this.createWorkspaceWrapper(this.realApp.workspace);
            this.metadataCache = this.createMetadataCacheWrapper(this.realApp.metadataCache);
            this.commands = this.createCommandsWrapper();
            this.plugins = this.createPluginsWrapper();
        }
        else {
            // Mode test - utiliser des mocks
            this.vault = this.createMockVault();
            this.workspace = this.createMockWorkspace();
            this.metadataCache = this.createMockMetadataCache();
            this.commands = this.createMockCommands();
            this.plugins = this.createMockPlugins();
        }
    }
    // Factory method pour créer avec la vraie App d'Obsidian
    AppShim.createFromObsidianApp = function (app) {
        return new AppShim(app);
    };
    // Factory method pour les tests
    AppShim.createMock = function () {
        return new AppShim();
    };
    Object.defineProperty(AppShim.prototype, "realObsidianApp", {
        // Getter pour obtenir la vraie App d'Obsidian (nécessaire pour certains composants)
        get: function () {
            return this.realApp;
        },
        enumerable: false,
        configurable: true
    });
    AppShim.prototype.createMockVault = function () {
        var _this = this;
        return {
            read: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, "mock content"];
            }); }); },
            create: function (path, data) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    // Créer un mock TFile simple
                    return [2 /*return*/, {
                            path: path,
                            name: path.split('/').pop() || path,
                            basename: (path.split('/').pop() || path).replace(/\.[^/.]+$/, ""),
                            extension: path.includes('.') ? path.split('.').pop() || '' : '',
                            stat: { mtime: Date.now(), ctime: Date.now(), size: 0 },
                            vault: null,
                            parent: null
                        }];
                });
            }); },
            modify: function (pathOrFile, data) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (typeof pathOrFile === 'string') {
                        return [2 /*return*/, {
                                path: pathOrFile,
                                name: pathOrFile.split('/').pop() || pathOrFile,
                                basename: (pathOrFile.split('/').pop() || pathOrFile).replace(/\.[^/.]+$/, ""),
                                extension: pathOrFile.includes('.') ? pathOrFile.split('.').pop() || '' : '',
                                stat: { mtime: Date.now(), ctime: Date.now(), size: 0 },
                                vault: null,
                                parent: null
                            }];
                    }
                    return [2 /*return*/, pathOrFile];
                });
            }); },
            "delete": function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); },
            exists: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, true];
            }); }); },
            getFiles: function () { return []; },
            getAbstractFileByPath: function () { return null; },
            rename: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); },
            getName: function () { return "MockVault"; },
            createFolder: function (path) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, ({
                            path: path,
                            name: path.split('/').pop() || path,
                            children: [],
                            isRoot: function () { return false; },
                            vault: null,
                            parent: null
                        })];
                });
            }); },
            getAllFolders: function () { return []; },
            adapter: {
                basePath: "/mock-vault",
                read: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, "mock file content"];
                }); }); },
                getResourcePath: function (path) { return "file:///mock-vault/".concat(path); }
            }
        };
    };
    AppShim.prototype.createMockWorkspace = function () {
        var _this = this;
        return {
            getActiveFile: function () { return null; },
            setActiveFile: function () { },
            openFile: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); },
            onLayoutReady: function () { },
            getLeavesOfType: function () { return []; },
            getLeaf: function () { return null; }
        };
    };
    AppShim.prototype.createMockMetadataCache = function () {
        return {
            getFileCache: function () { return ({ frontmatter: {} }); },
            on: function () { },
            off: function () { },
            resolvedLinks: {}
        };
    };
    AppShim.prototype.createMockCommands = function () {
        return {
            addCommand: function () { },
            executeCommand: function () { },
            listCommands: function () { return []; }
        };
    };
    AppShim.prototype.createMockPlugins = function () {
        var _this = this;
        return {
            enablePlugin: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); },
            disablePlugin: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); },
            getPlugin: function () { return null; },
            loadedPlugins: new Map()
        };
    };
    // Wrapper methods pour utiliser la vraie App d'Obsidian
    AppShim.prototype.createVaultWrapper = function (realVault) {
        var _this = this;
        return {
            read: function (pathOrFile) { return realVault.read(pathOrFile); },
            create: function (path, data) { return realVault.create(path, data); },
            modify: function (pathOrFile, data) { return realVault.modify(pathOrFile, data); },
            "delete": function (pathOrFile) { return realVault["delete"](pathOrFile); },
            exists: function (path) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, realVault.adapter.exists(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); }); },
            getFiles: function () { return realVault.getFiles(); },
            getAbstractFileByPath: function (path) { return realVault.getAbstractFileByPath(path); },
            rename: function (file, newPath) { return realVault.rename(file, newPath); },
            getName: function () { return realVault.getName(); },
            createFolder: function (path) { return realVault.createFolder(path); },
            getAllFolders: function () { return realVault.getAllFolders ? realVault.getAllFolders() : []; },
            adapter: realVault.adapter
        };
    };
    AppShim.prototype.createWorkspaceWrapper = function (realWorkspace) {
        return {
            getActiveFile: function () { return realWorkspace.getActiveFile(); },
            setActiveFile: function (file) { return realWorkspace.setActiveFile(file); },
            openFile: function (file) { return realWorkspace.openLinkText(file.path, ''); },
            onLayoutReady: function (cb) { return realWorkspace.onLayoutReady(cb); },
            getLeavesOfType: function (type) { return realWorkspace.getLeavesOfType(type); },
            getLeaf: function (newLeaf) { return realWorkspace.getLeaf(newLeaf); }
        };
    };
    AppShim.prototype.createMetadataCacheWrapper = function (realMetadataCache) {
        return {
            getFileCache: function (pathOrFile) { return realMetadataCache.getFileCache(pathOrFile); },
            on: function (event, cb) { return realMetadataCache.on(event, cb); },
            off: function (event, cb) { return realMetadataCache.off(event, cb); },
            resolvedLinks: realMetadataCache.resolvedLinks || {}
        };
    };
    AppShim.prototype.createCommandsWrapper = function () {
        var _a;
        // Dans Obsidian, les commandes sont dans app.commands
        var commands = (_a = this.realApp) === null || _a === void 0 ? void 0 : _a.commands;
        return {
            addCommand: function (command) { return commands === null || commands === void 0 ? void 0 : commands.addCommand(command); },
            executeCommand: function (id) { return commands === null || commands === void 0 ? void 0 : commands.executeCommandById(id); },
            listCommands: function () { return (commands === null || commands === void 0 ? void 0 : commands.listCommands()) || []; }
        };
    };
    AppShim.prototype.createPluginsWrapper = function () {
        var _this = this;
        var _a;
        // Dans Obsidian, les plugins sont dans app.plugins
        var plugins = (_a = this.realApp) === null || _a === void 0 ? void 0 : _a.plugins;
        return {
            enablePlugin: function (id) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, plugins === null || plugins === void 0 ? void 0 : plugins.enablePlugin(id)];
            }); }); },
            disablePlugin: function (id) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, plugins === null || plugins === void 0 ? void 0 : plugins.disablePlugin(id)];
            }); }); },
            getPlugin: function (id) { return plugins === null || plugins === void 0 ? void 0 : plugins.getPlugin(id); },
            loadedPlugins: (plugins === null || plugins === void 0 ? void 0 : plugins.plugins) || new Map()
        };
    };
    return AppShim;
}());
exports["default"] = AppShim;
