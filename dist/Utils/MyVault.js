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
var _a;
exports.__esModule = true;
exports.MyVault = void 0;
var Institution_1 = require("Classes/Institution");
var App_1 = require("./App");
var Lieu_1 = require("Classes/Lieu");
var Personne_1 = require("Classes/Personne");
var VaultClassAdapter_1 = require("./VaultClassAdapter");
var FileProperty_1 = require("./Properties/FileProperty");
var Modals_1 = require("./Modals/Modals");
var Utils_1 = require("./Utils");
var Action_1 = require("Classes/Action");
var Partenariat_1 = require("Classes/Partenariat");
var GeoData_1 = require("./Data/GeoData");
var Evenement_1 = require("Classes/Evenement");
var Piece_1 = require("Classes/Production/Piece");
var Assemblage_1 = require("Classes/Production/Assemblage");
var Fourniture_1 = require("Classes/Production/Fourniture");
var Fournisseur_1 = require("Classes/Production/Fournisseur");
var Famille_1 = require("Classes/Production/Famille");
var FreecadFile_1 = require("./3D/FreecadFile");
var Commande_1 = require("Classes/Production/Commande");
var Machine_1 = require("Classes/Production/Machine");
var Procedure_1 = require("Classes/Production/Procedure");
var Animateur_1 = require("Classes/Animateur");
var Note_1 = require("Classes/Note");
var MyVault = /** @class */ (function () {
    function MyVault(app, settings) {
        this.dataFiles = {};
        this.classAdapter = null;
        this.app = app;
        this.settings = settings;
        this.files = {}; // Contains all classes files for quick search
        if (settings.dataFile) {
            MyVault.geoData = new GeoData_1.GeoData(app, settings.dataFile, settings.additionalFiles);
        }
        // Initialize the dynamic class adapter if config path is available
        if (settings.configPath) {
            this.classAdapter = new VaultClassAdapter_1.VaultClassAdapter(this, settings.configPath);
        }
    }
    MyVault.prototype.getPersonalName = function () {
        return this.settings.personalName;
    };
    MyVault.prototype.getFileData = function (classe, name) {
        if (name) {
            if (name in this.dataFiles) {
                this.dataFiles[name].checkUpdate();
                return this.dataFiles[name];
            }
        }
        if (!MyVault.geoData) {
            return null;
        }
        return MyVault.geoData.getGeoData(classe.getName(false)) || null;
    };
    MyVault.prototype.getAsyncFileData = function (classe, name) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var file, freecadFile;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!name) return [3 /*break*/, 2];
                        file = this.getMediaFromLink(name);
                        if (!file) {
                            console.error("Fichier non trouvé : " + name);
                            return [2 /*return*/, null];
                        }
                        if (!(((_a = file.extension) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "fcstd")) return [3 /*break*/, 2];
                        freecadFile = new FreecadFile_1.FreecadFile(this, file);
                        return [4 /*yield*/, freecadFile.generateJsonData()];
                    case 1:
                        _b.sent();
                        this.dataFiles[name] = freecadFile;
                        return [2 /*return*/, freecadFile];
                    case 2: return [2 /*return*/, this.getFileData(classe)];
                }
            });
        });
    };
    MyVault.prototype.getGeoData = function (locationClass, locationSubclass, targetClass, targetSubclass) {
        var _this = this;
        var geodata = MyVault.geoData.getGeoDataList(locationClass.getName(false), locationSubclass, targetSubclass);
        console.log(locationClass);
        console.log("Geodata : ", geodata);
        var existing = locationClass.getChildren().filter(function (child) {
            var _a;
            return child.getClasse() === targetClass
                && ((_a = child.getSelectedSubClasse()) === null || _a === void 0 ? void 0 : _a.getsubClassName()) === targetSubclass;
        });
        console.log("Existing : ", existing);
        if (geodata.length === 0) {
            return existing;
        }
        var data = geodata.map(function (data) {
            var exist = existing.find(function (file) { return file.getName(false) === data.name; });
            if (exist) {
                return exist;
            }
            var classe = _this.getClasseFromName(targetClass);
            var subClass = classe.subClassesProperty.getSubClassFromName(targetSubclass);
            if (subClass) {
                var newSubClass = new subClass(classe, data);
                newSubClass.updateParent(_this);
                return newSubClass;
            }
        }).sort(function (a, b) {
            if (a && b) {
                return a.getName(false).localeCompare(b.getName(false));
            }
            return 0;
        });
        console.log("Data : ", data);
        return data.filter(function (item) { return item !== undefined; });
    };
    MyVault.prototype.getSubClasseFromName = function (name) {
        for (var classeName in MyVault.classes) {
            var classe = MyVault.classes[classeName];
            if (classe.subClassesProperty) {
                var subClass = classe.subClassesProperty.getSubClassFromName(name);
                if (subClass) {
                    return [classe, subClass];
                }
            }
        }
        throw new Error("SubClass with name ".concat(name, " not found"));
    };
    MyVault.prototype.getGeoDataFromName = function (name) {
        if (!MyVault.geoData) {
            console.error("GeoData is not initialized");
            return;
        }
        return MyVault.geoData.getGeoData(name);
    };
    MyVault.prototype.getClasseFromName = function (name) {
        return MyVault.classes[name];
    };
    /**
     * Get dynamic class from name (async version)
     */
    MyVault.prototype.getDynamicClasseFromName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.classAdapter) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.classAdapter.getClass(name)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Failed to get dynamic class ".concat(name, ":"), error_1);
                        return [3 /*break*/, 4];
                    case 4: 
                    // Fallback to legacy system
                    return [2 /*return*/, this.getClasseFromName(name) || null];
                }
            });
        });
    };
    /**
     * Get all available class names (including dynamic ones)
     */
    MyVault.prototype.getAllClassNames = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.classAdapter) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.classAdapter.getAvailableClasses()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Failed to get dynamic class names:', error_2);
                        return [3 /*break*/, 4];
                    case 4: 
                    // Fallback to legacy system
                    return [2 /*return*/, Object.keys(MyVault.classes)];
                }
            });
        });
    };
    MyVault.prototype.getGeoParent = function (classe) {
        return __awaiter(this, void 0, void 0, function () {
            var fileName, parentFileName_1, parentFile, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!MyVault.geoData) {
                            console.error("GeoData is not initialized");
                            return [2 /*return*/];
                        }
                        fileName = classe.getName(false);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        parentFileName_1 = MyVault.geoData.getParent(fileName);
                        if (!parentFileName_1) {
                            return [2 /*return*/];
                        }
                        parentFile = this.app.vault.getFiles().find(function (f) { return f.name === "".concat(parentFileName_1, ".md"); });
                        if (!!parentFile) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createFile(Lieu_1.Lieu, parentFileName_1)];
                    case 2:
                        parentFile = _a.sent();
                        _a.label = 3;
                    case 3:
                        if (parentFile) {
                            return [2 /*return*/, this.getFromFile(parentFile)];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Error while getting parent from GeoData : " + error_3);
                        return [2 /*return*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    MyVault.prototype.readLinkFile = function (link, path) {
        var _a, _b, _c;
        if (path === void 0) { path = false; }
        if (!link || typeof link !== "string")
            return "";
        // Match [[file|alias]] or [[file]]
        var match = link.match(/^\[\[([^\|\]]+?)(?:)?(?:\|([^\]]+))?\]\]$/);
        if (match) {
            var fileName = (_a = match[1]) === null || _a === void 0 ? void 0 : _a.trim();
            var alias = (_b = match[2]) === null || _b === void 0 ? void 0 : _b.trim();
            if (path) {
                return /\.[^\/\\]+$/.test(fileName) ? fileName : "".concat(fileName, ".md");
            }
            else {
                return alias ? alias : ((_c = fileName.split("/").pop()) === null || _c === void 0 ? void 0 : _c.replace(".md", "")) || "";
            }
        }
        // If not a wikilink, just return the trimmed link
        return link.trim();
    };
    MyVault.prototype.getFromLink = function (name, log) {
        if (log === void 0) { log = true; }
        if (!name) {
            return null;
        }
        // Search with the path
        var path = this.readLinkFile(name, true);
        var directfile = this.app.vault.getFiles().find(function (f) {
            return f.path.trim() === path.trim();
        });
        if (directfile) {
            if (directfile.path in Object.keys(this.files)) {
                return this.files[directfile.path];
            }
            return this.createClasse(directfile);
        }
        var fileName = path.split("/").pop() || "";
        var files = this.app.vault.getFiles().filter(function (f) { return f.name === fileName; });
        if (files.length > 0) {
            var file = files[0];
            if (files.length > 1) {
                var path_1 = this.readLinkFile(name, true);
                if (path_1) {
                    // Try to find the best match by walking up the path segments
                    var segments = path_1.split("/");
                    var _loop_1 = function () {
                        var candidatePath = segments.join("/");
                        var bestMatch = files.find(function (f) { return f.path.endsWith("/" + candidatePath) || f.path === candidatePath; });
                        if (bestMatch) {
                            file = bestMatch;
                            return "break";
                        }
                        segments.shift(); // Remove the first segment and try again
                    };
                    while (segments.length > 0) {
                        var state_1 = _loop_1();
                        if (state_1 === "break")
                            break;
                    }
                }
                else {
                    console.error("Plusieurs fichiers trouvés pour le lien sans chemin : " + name, files);
                }
            }
            if (file.path in Object.keys(this.files)) {
                return this.files[file.path];
            }
            return this.createClasse(file);
        }
        if (log) {
            console.error("Fichier non trouvé : " + name);
        }
        return null;
    };
    MyVault.prototype.getMediaFromLink = function (link) {
        var path = this.readLinkFile(link, true);
        var file = this.app.vault.getFiles().find(function (f) {
            return f.path === path;
        });
        if (file) {
            return file;
        }
        // try with the file name
        var fileName = this.readLinkFile(link);
        var files = this.app.vault.getFiles().filter(function (f) { return f.name === fileName; });
        if (files.length > 0) {
            var file_1 = files[0];
            if (files.length > 1) {
                console.error("Plusieurs fichiers trouvés pour le lien sans chemin : " + link, files);
            }
            return file_1;
        }
        console.error("Media non trouvé : " + link);
        return null;
    };
    MyVault.prototype.getFromFolder = function (folder) {
        var name = folder.path.split("/")[folder.path.split("/").length - 1];
        for (var _i = 0, _a = folder.children || []; _i < _a.length; _i++) {
            var file = _a[_i];
            if ((0, App_1.isTFile)(file) && file.name.includes(name)) {
                return this.getFromFile(file);
            }
        }
        console.error("Le dossier n'a pas de fichier classe : " + folder.path);
    };
    MyVault.prototype.getFromFile = function (file) {
        if ((0, App_1.isTFile)(file)) {
            var existingClass = this.files[file.path];
            if (existingClass) {
                return existingClass;
            }
            var classe = void 0;
            // Try new dynamic system first if available
            if (this.classAdapter) {
                try {
                    // Note: This is async but we need sync. In practice, we'd need to refactor this method
                    // For now, fall back to the old system
                    classe = this.createClasse(file);
                }
                catch (error) {
                    console.error('Dynamic class creation failed, falling back to legacy:', error);
                    classe = this.createClasse(file);
                }
            }
            else {
                classe = this.createClasse(file);
            }
            if (classe) {
                this.files[file.path] = classe;
            }
            return classe;
        }
        else if ((0, App_1.isTFolder)(file)) {
            var filePath = file.path + "/" + file.name + ".md";
            var existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile) {
                return this.getFromFile(existingFile);
            }
        }
    };
    /**
     * Async version of getFromFile that supports dynamic classes
     */
    MyVault.prototype.getFromFileAsync = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var existingClass, classe, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        existingClass = this.files[file.path];
                        if (existingClass) {
                            return [2 /*return*/, existingClass];
                        }
                        classe = null;
                        if (!this.classAdapter) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.classAdapter.getFromFile(file)];
                    case 2:
                        classe = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        console.error('Dynamic class creation failed, falling back to legacy:', error_4);
                        classe = this.createClasse(file) || null;
                        return [3 /*break*/, 4];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        classe = this.createClasse(file) || null;
                        _a.label = 6;
                    case 6:
                        if (classe) {
                            this.files[file.path] = classe;
                        }
                        return [2 /*return*/, classe];
                }
            });
        });
    };
    MyVault.prototype.updateFile = function (file) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: 
                    // The file as an update, update it in the classes
                    return [4 /*yield*/, ((_a = this.getFromFile(file)) === null || _a === void 0 ? void 0 : _a.update())];
                    case 1:
                        // The file as an update, update it in the classes
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MyVault.prototype.checkFile = function (file) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: 
                    // The file as an update, update it in the classes
                    return [4 /*yield*/, ((_a = this.getFromFile(file)) === null || _a === void 0 ? void 0 : _a.check())];
                    case 1:
                        // The file as an update, update it in the classes
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MyVault.prototype.createLinkFile = function (parentFile, name) {
        return __awaiter(this, void 0, void 0, function () {
            var parent, property;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parent = this.getFromFile(parentFile);
                        property = parent === null || parent === void 0 ? void 0 : parent.findPropertyFromValue(name, true);
                        if (!(property instanceof FileProperty_1.FileProperty)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createFile(this.getClasseFromName(property.classes[0]), name)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (parent === null || parent === void 0 ? void 0 : parent.update())];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MyVault.prototype.createFile = function (classeType, name, args) {
        if (classeType === void 0) { classeType = null; }
        if (name === void 0) { name = ""; }
        if (args === void 0) { args = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var classe, templatePath, templateFile, newFilePath, templateContent, file, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!classeType) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, Modals_1.selectClass)(this, "Quelle classe pour se fichier ?")];
                    case 1:
                        classeType = _a.sent();
                        if (!classeType) {
                            return [2 /*return*/];
                        }
                        _a.label = 2;
                    case 2:
                        console.log("Args ; ", args);
                        if (!!name) return [3 /*break*/, 4];
                        return [4 /*yield*/, (0, Modals_1.selectFile)(this, [classeType.getClasse()], { hint: "Entrer un nom pour ce fichier", classeArgs: args })];
                    case 3:
                        classe = _a.sent();
                        // Select File call createFile if the file doesn't exist
                        // No need to continue
                        return [2 /*return*/, classe === null || classe === void 0 ? void 0 : classe.file];
                    case 4:
                        templatePath = this.settings.templateFolder + "/" + classeType.getClasse() + ".md";
                        templateFile = this.app.vault.getAbstractFileByPath(templatePath);
                        newFilePath = name.includes(".md") ? name : "".concat(name, ".md");
                        templateContent = "---\nClasse: " + classeType.getClasse() + "\n---\n";
                        if (!(templateFile && (0, App_1.isTFile)(templateFile))) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.app.vault.read(templateFile)];
                    case 5:
                        templateContent = _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        console.warn("Le fichier template n'existe pas :" + templatePath + ". Un fichier vide sera créé.");
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 9, , 13]);
                        return [4 /*yield*/, this.app.vault.create(newFilePath, templateContent)];
                    case 8:
                        file = _a.sent();
                        console.log("Nouveau fichier créé : " + newFilePath);
                        return [3 /*break*/, 13];
                    case 9:
                        error_5 = _a.sent();
                        // Modifier le fichier s'il existe déjà
                        file = this.app.vault.getAbstractFileByPath(newFilePath);
                        if (!(file && (0, App_1.isTFile)(file))) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.app.vault.modify(file, templateContent)];
                    case 10:
                        _a.sent();
                        console.log("Fichier modifié : " + newFilePath);
                        return [3 /*break*/, 12];
                    case 11: throw Error("Le fichier n'a pas pu être créé ou modifié : " + newFilePath);
                    case 12: return [3 /*break*/, 13];
                    case 13:
                        if (!file) {
                            throw Error("Le fichier n'existe pas : " + newFilePath);
                        }
                        return [4 /*yield*/, (0, Utils_1.waitForFileMetaDataUpdate)(this.app, file.path, "Classe", function () { return __awaiter(_this, void 0, void 0, function () {
                                var classe;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                                        case 1:
                                            _a.sent();
                                            if (!file) {
                                                return [2 /*return*/];
                                            }
                                            classe = this.getFromFile(file);
                                            if (!classe) {
                                                console.error("Classe non trouvée pour le fichier : " + file.path);
                                                return [2 /*return*/];
                                            }
                                            return [4 /*yield*/, classe.populate(args)];
                                        case 2:
                                            _a.sent();
                                            return [4 /*yield*/, classe.check()];
                                        case 3:
                                            _a.sent();
                                            return [4 /*yield*/, classe.update()];
                                        case 4:
                                            _a.sent();
                                            console.log("Classe créée : " + classe.getName(false));
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 14:
                        _a.sent();
                        return [2 /*return*/, file];
                }
            });
        });
    };
    MyVault.prototype.refreshAll = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var watchedFiles, _i, _c, file, _d, _e, folder;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        watchedFiles = [];
                        _i = 0, _c = this.app.vault.getFiles();
                        _f.label = 1;
                    case 1:
                        if (!(_i < _c.length)) return [3 /*break*/, 5];
                        file = _c[_i];
                        if (watchedFiles.includes(file.name) || file.path.startsWith("Outils")) {
                            return [3 /*break*/, 4];
                        }
                        console.log("Refresh : " + file.path);
                        return [4 /*yield*/, ((_a = this.getFromFile(file)) === null || _a === void 0 ? void 0 : _a.update())];
                    case 2:
                        _f.sent();
                        return [4 /*yield*/, ((_b = this.getFromFile(file)) === null || _b === void 0 ? void 0 : _b.check())];
                    case 3:
                        _f.sent();
                        // Remove the duplicates
                        /*
                        for (let file2 of this.app.vault.getFiles()) {
                            // Compare the name
                            if (file.name === file2.name && file.path != file2.path && this.getFromFile(file)?.getClasse() === this.getFromFile(file2)?.getClasse()) {
                                console.error("Doublon de \n" + file.path + "\n" + file2.path);
                                // Keep the first by default
                                await this.app.vault.delete(file2);
                            }
                        }*/
                        watchedFiles.push(file.name);
                        _f.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5:
                        _d = 0, _e = this.app.vault.getAllFolders();
                        _f.label = 6;
                    case 6:
                        if (!(_d < _e.length)) return [3 /*break*/, 9];
                        folder = _e[_d];
                        if (!(folder.children && folder.children.length === 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.app.vault["delete"](folder)];
                    case 7:
                        _f.sent();
                        _f.label = 8;
                    case 8:
                        _d++;
                        return [3 /*break*/, 6];
                    case 9:
                        new App_1.Notice("Vault refresh");
                        return [2 /*return*/];
                }
            });
        });
    };
    MyVault.prototype.createClasse = function (file) {
        var _a;
        var metadata = (_a = this.app.metadataCache.getFileCache(file)) === null || _a === void 0 ? void 0 : _a.frontmatter;
        if (!metadata) {
            console.error("Pas de metadata");
            return;
        }
        var constructor = MyVault.classes[metadata["Classe"]];
        if (constructor) {
            return new constructor(this.app, this, file);
        }
        console.error("Type non connue : " + metadata["Classe"]);
    };
    MyVault.classes = (_a = {},
        _a[Institution_1.Institution.getClasse()] = Institution_1.Institution,
        _a[Personne_1.Personne.getClasse()] = Personne_1.Personne,
        _a[Lieu_1.Lieu.getClasse()] = Lieu_1.Lieu,
        _a[Action_1.Action.getClasse()] = Action_1.Action,
        _a[Partenariat_1.Partenariat.getClasse()] = Partenariat_1.Partenariat,
        _a[Evenement_1.Evenement.getClasse()] = Evenement_1.Evenement,
        _a[Animateur_1.Animateur.getClasse()] = Animateur_1.Animateur,
        _a[Note_1.Note.getClasse()] = Note_1.Note,
        _a[Piece_1.Piece.getClasse()] = Piece_1.Piece,
        _a[Assemblage_1.Assemblage.getClasse()] = Assemblage_1.Assemblage,
        _a[Fourniture_1.Fourniture.getClasse()] = Fourniture_1.Fourniture,
        _a[Fournisseur_1.Fournisseur.getClasse()] = Fournisseur_1.Fournisseur,
        _a[Famille_1.Famille.getClasse()] = Famille_1.Famille,
        _a[Commande_1.Commande.getClasse()] = Commande_1.Commande,
        _a[Machine_1.Machine.getClasse()] = Machine_1.Machine,
        _a[Procedure_1.Procedure.getClasse()] = Procedure_1.Procedure,
        _a);
    return MyVault;
}());
exports.MyVault = MyVault;
