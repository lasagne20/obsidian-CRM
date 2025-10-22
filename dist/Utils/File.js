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
exports.File = void 0;
var Utils_1 = require("./Utils");
var js_yaml_1 = require("js-yaml");
var File = /** @class */ (function () {
    function File(app, vault, file) {
        this.linkRegex = /^"?\[\[(.*?)\]\]"?$/;
        this.app = app;
        this.vault = vault;
        this.file = file;
        this.lock = false;
    }
    File.prototype.getFolderPath = function () {
        return this.file.path.substring(0, this.file.path.lastIndexOf("/"));
    };
    File.prototype.isFolderFile = function () {
        // Return true if the file is also a folder
        return this.file.path.substring(0, this.file.path.lastIndexOf("/")).endsWith(this.getName().replace(".md", ""));
    };
    File.prototype.getFolderFilePath = function () {
        // Return the folderFile path
        var path = this.getFolderPath();
        if (this.isFolderFile()) {
            return path;
        }
        return path + "/" + this.getName(false);
    };
    File.prototype.getParentFolderPath = function () {
        var path = this.getFolderPath();
        if (this.isFolderFile()) {
            path = path.substring(0, path.lastIndexOf("/"));
        }
        return path;
    };
    File.prototype.getName = function (md) {
        if (md === void 0) { md = true; }
        if (md) {
            return this.file.name;
        }
        return this.file.name.replace(".md", "");
    };
    File.prototype.getID = function () {
        var _a;
        var id = (_a = this.getMetadata()) === null || _a === void 0 ? void 0 : _a.Id;
        if (!id) {
            id = require("uuid").v4();
            this.updateMetadata("Id", id);
        }
        return id;
    };
    File.prototype.getFilePath = function () {
        // Return the file path
        return this.file.path;
    };
    File.prototype.getLink = function () {
        return "[[".concat(this.getFilePath(), "|").concat(this.getName(false), "]]");
    };
    File.prototype.move = function (targetFolderPath, targetFileName) {
        return __awaiter(this, void 0, void 0, function () {
            var subtargetPath, folder, moveFile, newFilePath, folder_1, existingFile, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.lock) return [3 /*break*/, 3];
                        _a.label = 1;
                    case 1:
                        if (!this.lock) return [3 /*break*/, 3];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 2:
                        _a.sent();
                        console.log("Waiting for lock");
                        return [3 /*break*/, 1];
                    case 3:
                        ;
                        this.lock = true;
                        if (!targetFileName) {
                            targetFileName = this.getName();
                        }
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, , 10, 11]);
                        subtargetPath = targetFolderPath + "/" + targetFileName;
                        folder = this.app.vault.getAbstractFileByPath(subtargetPath);
                        if (folder) {
                            targetFolderPath = subtargetPath;
                        }
                        moveFile = this.file;
                        newFilePath = "".concat(targetFolderPath, "/").concat(targetFileName);
                        if (this.isFolderFile()) {
                            folder_1 = this.app.vault.getAbstractFileByPath(this.getFolderPath());
                            if (folder_1) {
                                moveFile = folder_1;
                                newFilePath = newFilePath.replace(".md", "");
                            }
                        }
                        existingFile = this.app.vault.getAbstractFileByPath(newFilePath);
                        if (existingFile) {
                            console.log('Le fichier existe déjà, impossible de déplacer.');
                            this.lock = false;
                            return [2 /*return*/];
                        }
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 8, , 9]);
                        if (!moveFile) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.app.vault.rename(moveFile, newFilePath)];
                    case 6:
                        _a.sent();
                        console.log("Fichier d\u00E9plac\u00E9 vers ".concat(newFilePath));
                        _a.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_1 = _a.sent();
                        console.error('Erreur lors du déplacement du fichier :', error_1);
                        return [3 /*break*/, 9];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        this.lock = false;
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    File.prototype.getFromLink = function (name) {
        return this.vault.getFromLink(name);
    };
    File.prototype.getMetadata = function () {
        var _a;
        var metadata = (_a = this.app.metadataCache.getFileCache(this.file)) === null || _a === void 0 ? void 0 : _a.frontmatter;
        return metadata;
    };
    File.prototype.updateMetadata = function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            var fileContent, body, existingFrontmatter, frontmatter, newFrontmatter, newContent, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.lock) return [3 /*break*/, 3];
                        _a.label = 1;
                    case 1:
                        if (!this.lock) return [3 /*break*/, 3];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 2:
                        _a.sent();
                        console.log("Waiting for lock");
                        return [3 /*break*/, 1];
                    case 3:
                        ;
                        this.lock = true;
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, , 11, 12]);
                        console.log("Update metadata on " + this.getName() + " : " + key + " --> " + value);
                        return [4 /*yield*/, this.app.vault.read(this.file)];
                    case 5:
                        fileContent = _a.sent();
                        body = this.extractFrontmatter(fileContent).body;
                        existingFrontmatter = this.extractFrontmatter(fileContent).existingFrontmatter;
                        if (!existingFrontmatter) {
                            this.lock = false;
                            return [2 /*return*/];
                        }
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 9, , 10]);
                        frontmatter = (0, js_yaml_1.load)(existingFrontmatter);
                        if (!frontmatter) {
                            this.lock = false;
                            return [2 /*return*/];
                        }
                        ;
                        frontmatter[key] = value;
                        newFrontmatter = (0, js_yaml_1.dump)(frontmatter);
                        newContent = "---\n".concat(newFrontmatter, "\n---\n").concat(body);
                        return [4 /*yield*/, this.app.vault.modify(this.file, newContent)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, (0, Utils_1.waitForFileMetaDataUpdate)(this.app, this.getFilePath(), key, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/];
                            }); }); })];
                    case 8:
                        _a.sent();
                        console.log("Metdata updated");
                        return [3 /*break*/, 10];
                    case 9:
                        error_2 = _a.sent();
                        console.error("❌ Erreur lors du parsing du frontmatter:", error_2);
                        return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        this.lock = false;
                        return [7 /*endfinally*/];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    File.prototype.removeMetadata = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var frontmatter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Remove metadata " + key);
                        frontmatter = this.getMetadata();
                        if (!frontmatter)
                            return [2 /*return*/];
                        delete frontmatter[key];
                        return [4 /*yield*/, this.saveFrontmatter(frontmatter)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    File.prototype.reorderMetadata = function (propertiesOrder) {
        return __awaiter(this, void 0, void 0, function () {
            var frontmatter, _a, sortedFrontmatter, extraProperties;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        frontmatter = this.getMetadata();
                        if (!frontmatter)
                            return [2 /*return*/];
                        propertiesOrder.push("Id");
                        if (JSON.stringify(propertiesOrder) === JSON.stringify(Object.keys(frontmatter)))
                            return [2 /*return*/];
                        console.log("Re-order metadata");
                        _a = this.sortFrontmatter(frontmatter, propertiesOrder), sortedFrontmatter = _a.sortedFrontmatter, extraProperties = _a.extraProperties;
                        return [4 /*yield*/, this.saveFrontmatter(sortedFrontmatter, extraProperties)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    File.prototype.saveFrontmatter = function (frontmatter, extraProperties) {
        if (extraProperties === void 0) { extraProperties = []; }
        return __awaiter(this, void 0, void 0, function () {
            var fileContent, body, newFrontmatter, filteredExtraProperties, newContent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.app.vault.read(this.file)];
                    case 1:
                        fileContent = _a.sent();
                        body = this.extractFrontmatter(fileContent).body;
                        newFrontmatter = (0, js_yaml_1.dump)(frontmatter);
                        filteredExtraProperties = extraProperties.filter(function (prop) { return prop && prop.trim() !== ""; });
                        newContent = "---\n".concat(newFrontmatter, "\n---\n").concat(body);
                        return [4 /*yield*/, this.app.vault.modify(this.file, newContent)];
                    case 2:
                        _a.sent();
                        console.log("Updated file");
                        return [2 /*return*/];
                }
            });
        });
    };
    // Extraire le frontmatter et le reste du contenu
    File.prototype.extractFrontmatter = function (content) {
        var frontmatterRegex = /^---\n([\s\S]+?)\n---\n/;
        var match = content.match(frontmatterRegex);
        return {
            existingFrontmatter: match ? match[1] : "",
            body: match ? content.replace(match[0], "") : content
        };
    };
    // Trier les propriétés et identifier celles en surplus
    // Méthode simple pour les tests
    File.prototype.formatFrontmatter = function (frontmatter) {
        return (0, js_yaml_1.dump)(frontmatter);
    };
    File.prototype.sortFrontmatter = function (frontmatter, propertiesOrder) {
        var sortedFrontmatter = {};
        var extraProperties = [];
        propertiesOrder.forEach(function (prop) {
            if (prop in frontmatter) {
                sortedFrontmatter[prop] = frontmatter[prop];
            }
            else {
                sortedFrontmatter[prop] = null;
            }
        });
        Object.keys(frontmatter).forEach(function (prop) {
            if (!propertiesOrder.includes(prop)) {
                extraProperties.push("".concat(prop, ": ").concat(JSON.stringify(frontmatter[prop])));
            }
        });
        return { sortedFrontmatter: sortedFrontmatter, extraProperties: extraProperties };
    };
    return File;
}());
exports.File = File;
