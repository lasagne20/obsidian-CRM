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
exports.Classe = void 0;
var App_1 = require("../Utils/App");
var File_1 = require("../Utils/File");
var Property_1 = require("../Utils/Properties/Property");
var FileProperty_1 = require("../Utils/Properties/FileProperty");
var ObjectProperty_1 = require("Utils/Properties/ObjectProperty");
var Classe = /** @class */ (function (_super) {
    __extends(Classe, _super);
    function Classe(app, vault, file) {
        return _super.call(this, app, vault, file) || this;
    }
    Classe.getItems = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, []];
        }); });
    };
    Classe.prototype.getConstructor = function () {
        throw Error("Need to define the Classes");
    };
    Classe.prototype.getPrettyName = function () {
        return this.getName(false);
    };
    Classe.getConstructor = function () {
        throw Error("Need to define the Classes");
    };
    Classe.prototype.getClasse = function () {
        return this.getConstructor().className;
    };
    Classe.prototype.readProperty = function (name) {
        return this.getProperties()[name].read(this);
    };
    Classe.getClasse = function () {
        return this.className;
    };
    Classe.prototype.getparentProperty = function () {
        return this.getConstructor().parentProperty;
    };
    Classe.prototype.getParentValue = function () {
        var value = this.getparentProperty().read(this);
        if (value && value.length) {
            return value;
        }
        return "";
    };
    Classe.getparentProperty = function () {
        return this.parentProperty;
    };
    Classe.prototype.populate = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw Error("Need to define the Classes");
            });
        });
    };
    Classe.getProperties = function () {
        return this.getConstructor().Properties;
    };
    Classe.prototype.getSubClassFromName = function (name) {
        return this.getConstructor().subClassesProperty.getSubClassFromName(name);
    };
    Classe.prototype.getMetadataValue = function (name) {
        var metadata = _super.prototype.getMetadata.call(this);
        var data = this.vault.getFileData(this);
        var value = metadata ? metadata[name] : undefined;
        if (!value && data && Object.keys(data).contains(name)) {
            return data[name];
        }
        return value;
    };
    Classe.prototype.getProperties = function () {
        return this.getConstructor().Properties;
    };
    Classe.prototype.getAllProperties = function () {
        var _a;
        return __assign(__assign({}, this.getProperties()), (_a = this.getSelectedSubClasse()) === null || _a === void 0 ? void 0 : _a.getProperties());
    };
    Classe.prototype.getProperty = function (name) {
        // Basic properties
        if (Object.keys(this.getAllProperties()).contains(name)) {
            return [this, this.getAllProperties()[name]];
        }
        if (Object.values(this.getAllProperties()).map(function (prop) { return prop.name; }).contains(name)) {
            return [this, this.getAllProperties()[name]];
        }
        // Parent property
        if (name.startsWith("parent.")) {
            var parentProperty = this.getparentProperty();
            var fileName = parentProperty.getParentValue(parentProperty.read(this));
            var parent_1 = this.getFromLink(fileName);
            if (parent_1) {
                return parent_1.getProperty(name.split(".").slice(1).join("."));
            }
        }
        // Object properties (only one level)
        //TODO : How to choose the right index ?
        /*let names = name.split(".")
        if (names.length > 1){
          let propParent = this.getAllProperties()[names[0]]
          if(propParent && propParent.type === "object"){
              let property = (propParent as any).properties[names[1]]
              if (property){
                return [propParent.read(this)[0], property]
            }
          }
        }*/
        return [this, null];
    };
    Classe.prototype.getIncomingLinks = function () {
        var incomingLinks = [];
        var files = this.app.vault.getFiles();
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var links = this.app.metadataCache.resolvedLinks[file.path];
            if (links && links[this.file.path]) {
                var linkedClasse = this.vault.getFromFile(file);
                if (linkedClasse) {
                    incomingLinks.push(linkedClasse);
                }
            }
        }
        return incomingLinks;
    };
    Classe.prototype.getSelectedSubClasse = function () {
        var subClassesProperty = this.getConstructor().subClassesProperty;
        if (subClassesProperty) {
            return subClassesProperty.getSubClass(this);
        }
        return undefined;
    };
    Classe.prototype.findPropertyFromValue = function (content, link) {
        if (link === void 0) { link = false; }
        for (var _i = 0, _a = Object.values(this.constructor.Properties); _i < _a.length; _i++) {
            var prop = _a[_i];
            if (link && !(prop instanceof FileProperty_1.FileProperty)) {
                continue;
            }
            var value = prop.read(this);
            if (value && JSON.stringify(value).contains(content)) {
                return prop;
            }
        }
        ;
        return null;
    };
    Classe.prototype.getParent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var parentProperty, fileName;
            return __generator(this, function (_a) {
                parentProperty = this.getparentProperty();
                fileName = parentProperty.getParentValue(parentProperty.read(this));
                return [2 /*return*/, this.getFromLink(fileName)];
            });
        });
    };
    Classe.prototype.updateLocation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var parent, correctPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check if the file are right place, move it if needed
                        console.log("Update Location");
                        return [4 /*yield*/, this.getParent()];
                    case 1:
                        parent = _a.sent();
                        if (!(!parent || parent === undefined)) return [3 /*break*/, 2];
                        // Le fichier n'existe pas
                        console.error("Le parent n'existe pas");
                        return [3 /*break*/, 6];
                    case 2:
                        if (!(this.getparentProperty().getClasses() &&
                            !this.getparentProperty().getClasses().includes(parent.getClasse()))) return [3 /*break*/, 3];
                        // ce n'est pas la bonne classe
                        console.error("Mauvaise classe pour cette propiété: " + parent.getClasse() + " au lieu de " + this.getparentProperty().getClasses());
                        return [3 /*break*/, 6];
                    case 3:
                        correctPath = parent.getChildFolderPath(this);
                        if (!(this.getParentFolderPath() != correctPath)) return [3 /*break*/, 6];
                        return [4 /*yield*/, parent.checkChildFolder(this)
                            // Move the child to the childFolder
                        ];
                    case 4:
                        _a.sent();
                        // Move the child to the childFolder
                        console.log("Move to child folder : " + correctPath);
                        return [4 /*yield*/, this.move(correctPath)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Classe.prototype.checkChildFolder = function (child) {
        return __awaiter(this, void 0, void 0, function () {
            var childFolderPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        childFolderPath = this.getChildFolderPath(child);
                        return [4 /*yield*/, this.addSubFolder(childFolderPath)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Classe.prototype.addSubFolder = function (folderPath) {
        return __awaiter(this, void 0, void 0, function () {
            var parentFolderPath, parentfolder, e_1, childFolder, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Add child folder");
                        parentFolderPath = this.getFolderFilePath();
                        parentfolder = this.app.vault.getAbstractFileByPath(parentFolderPath);
                        if (!!parentfolder) return [3 /*break*/, 5];
                        // If the folder doesn't exist create it and move the file into it
                        console.log("Create Parent Folder Path : " + parentFolderPath);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.app.vault.createFolder(parentFolderPath)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.move(parentFolderPath)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        console.error(e_1);
                        return [3 /*break*/, 5];
                    case 5:
                        childFolder = this.app.vault.getAbstractFileByPath(folderPath);
                        if (!!childFolder) return [3 /*break*/, 9];
                        // If the folder doesn't exist create it and move the file into it
                        console.log("Create child Folder Path : " + folderPath);
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.app.vault.createFolder(folderPath)];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        e_2 = _a.sent();
                        console.error(e_2);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    Classe.prototype.getChildFolderPath = function (child) {
        return this.getFolderFilePath();
    };
    Classe.prototype.updatePropertyParent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var path, _a, _b, _i, i, parentPath, parentfile, parent_2, parentProperty, values;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // Find the parent from the above folders
                        console.log("Update parent property : ", this.getFilePath());
                        path = this.getFolderPath();
                        if (this.isFolderFile()) {
                            path = path.substring(0, path.lastIndexOf("/")); // Get the parent folder
                        }
                        _a = [];
                        for (_b in [0, 1, 2])
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 9];
                        i = _a[_i];
                        parentPath = path + "/" + path.split("/")[path.split("/").length - 1] + ".md";
                        parentfile = this.app.vault.getAbstractFileByPath(parentPath);
                        if (!(parentfile && (0, App_1.isTFile)(parentfile))) return [3 /*break*/, 7];
                        parent_2 = this.vault.getFromFile(parentfile);
                        parentProperty = this.getparentProperty();
                        if (!(parentProperty instanceof ObjectProperty_1.ObjectProperty && parent_2)) return [3 /*break*/, 3];
                        values = parentProperty.formatParentValue(parent_2.getLink());
                        return [4 /*yield*/, this.updateMetadata(parentProperty.name, values)];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.updateMetadata(parentProperty.name, parent_2 === null || parent_2 === void 0 ? void 0 : parent_2.getLink())];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5: return [4 /*yield*/, this.update()]; // To move it if it is not the right subfolder
                    case 6:
                        _c.sent(); // To move it if it is not the right subfolder
                        return [2 /*return*/];
                    case 7:
                        path = path.substring(0, path.lastIndexOf("/")); // Get the next parent
                        _c.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 1];
                    case 9:
                        console.log("No parent found for : " + this.getFolderPath());
                        return [2 /*return*/];
                }
            });
        });
    };
    Classe.prototype.update = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateLocation()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Classe.prototype.getChildren = function (file) {
        if (file === void 0) { file = null; }
        var children = [];
        if (!file && this.isFolderFile()) {
            file = this.file.parent;
        }
        if (file && (0, App_1.isTFolder)(file)) {
            for (var _i = 0, _a = file.children || []; _i < _a.length; _i++) {
                var child = _a[_i];
                if ((0, App_1.isTFile)(child)) {
                    var classe = this.vault.getFromFile(child);
                    if (classe) {
                        children.push(classe);
                    }
                }
                else if ((0, App_1.isTFolder)(child)) {
                    children.push.apply(children, this.getChildren(child)); // Récursion sur les sous-dossiers
                }
            }
        }
        return children;
    };
    Classe.prototype.getTopDisplayContent = function () {
        var container = document.createElement("div");
        var properties = document.createElement("div");
        //Display the properties
        for (var _i = 0, _a = Object.values(this.getProperties()); _i < _a.length; _i++) {
            var property = _a[_i];
            properties.appendChild(property.getDisplay(this));
        }
        container.appendChild(properties);
        return container;
    };
    Classe.prototype.reloadTopDisplayContent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, property;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = Object.values(this.getProperties());
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        property = _a[_i];
                        return [4 /*yield*/, property.reloadDynamicContent(this)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Classe.prototype.moveMediaToFolder = function (property, folder, othersExtensions) {
        if (othersExtensions === void 0) { othersExtensions = []; }
        return __awaiter(this, void 0, void 0, function () {
            var path, mediaLinks, _i, mediaLinks_1, mediaLink, subfolderPath, media, existing, _a, othersExtensions_1, extension, otherFileName, otherMedia, existing_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        path = this.getFolderFilePath();
                        mediaLinks = property.read(this);
                        if (!mediaLinks || mediaLinks.length === 0) {
                            return [2 /*return*/];
                        }
                        if (!(mediaLinks instanceof Array)) {
                            mediaLinks = [mediaLinks];
                        }
                        _i = 0, mediaLinks_1 = mediaLinks;
                        _b.label = 1;
                    case 1:
                        if (!(_i < mediaLinks_1.length)) return [3 /*break*/, 10];
                        mediaLink = mediaLinks_1[_i];
                        subfolderPath = path + "/" + folder ? path + "/" + folder : path;
                        console.log("Move media to folder : " + subfolderPath);
                        this.addSubFolder(subfolderPath);
                        media = this.vault.getMediaFromLink(mediaLink);
                        if (!(media && (media.path !== subfolderPath + "/" + media.name))) return [3 /*break*/, 9];
                        console.log("Move media to folder : " + subfolderPath + "/" + media.name);
                        existing = this.vault.app.vault.getAbstractFileByPath(subfolderPath + "/" + media.name);
                        if (!existing) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.vault.app.vault["delete"](existing)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        this.vault.app.vault.rename(media, subfolderPath + "/" + media.name);
                        // Update the property
                        return [4 /*yield*/, this.updateMetadata(property.name, "[[".concat(subfolderPath, "/").concat(media.name, "|").concat(media.name, "]]"))];
                    case 4:
                        // Update the property
                        _b.sent();
                        _a = 0, othersExtensions_1 = othersExtensions;
                        _b.label = 5;
                    case 5:
                        if (!(_a < othersExtensions_1.length)) return [3 /*break*/, 9];
                        extension = othersExtensions_1[_a];
                        otherFileName = media.name.split(".")[0] + extension;
                        otherMedia = this.vault.getMediaFromLink(otherFileName);
                        if (!(otherMedia && (otherMedia.path !== subfolderPath + "/" + otherFileName))) return [3 /*break*/, 8];
                        console.log("Move other media " + otherFileName + " to folder : " + subfolderPath + "/" + otherFileName);
                        existing_1 = this.vault.app.vault.getAbstractFileByPath(subfolderPath + "/" + otherFileName);
                        if (!existing_1) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.vault.app.vault["delete"](existing_1)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        this.vault.app.vault.rename(otherMedia, subfolderPath + "/" + otherFileName);
                        _b.label = 8;
                    case 8:
                        _a++;
                        return [3 /*break*/, 5];
                    case 9:
                        _i++;
                        return [3 /*break*/, 1];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    Classe.prototype.startWith = function (property) {
        return __awaiter(this, void 0, void 0, function () {
            var value, file, title, cleanTitle, prefix, rawDate, newName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (property instanceof Property_1.Property) {
                            value = property.read(this);
                            if (property instanceof FileProperty_1.FileProperty) {
                                value = this.vault.readLinkFile(value);
                            }
                        }
                        else {
                            value = property;
                        }
                        if (!value)
                            return [2 /*return*/];
                        file = this.file;
                        title = file.basename;
                        cleanTitle = title ? title.replace(/^[^/\\:*?"<>|]{1,50}\s-\s/, "").trim() : "";
                        prefix = value;
                        if (property instanceof Property_1.Property && property.type.toLowerCase() === "daterange") {
                            rawDate = value.includes("to")
                                ? value.split("to")[0].trim()
                                : value;
                            prefix = rawDate ? property.getPretty(rawDate) : "";
                        }
                        newName = "".concat(prefix, " - ").concat(cleanTitle);
                        if (!(title !== newName)) return [3 /*break*/, 2];
                        console.log("Renaming file from ".concat(title, " to ").concat(newName));
                        return [4 /*yield*/, this.move(this.getParentFolderPath(), newName + ".md")];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    Classe.prototype.check = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.getID();
                return [2 /*return*/];
            });
        });
    };
    Classe.className = "";
    Classe.classIcon = "box";
    return Classe;
}(File_1.File));
exports.Classe = Classe;
