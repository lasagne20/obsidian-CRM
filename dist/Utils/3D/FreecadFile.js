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
exports.FreecadFile = void 0;
var fast_xml_parser_1 = require("fast-xml-parser");
var JSZip = require("jszip");
var App_1 = require("../App");
var Modals_1 = require("Utils/Modals/Modals");
var FreecadData_1 = require("./FreecadData");
var path_1 = require("path");
var FREECAD_DATE_CHECK = "FreecadLastCheck";
var FreecadFile = /** @class */ (function () {
    function FreecadFile(vault, file) {
        this.jsonData = null;
        this.lastCheck = null;
        this.vault = vault;
        if (!file.path.endsWith('.FCStd') && !file.path.endsWith('.fcstd')) {
            throw new Error('Le fichier doit avoir une extension .FCStd');
        }
        this.file = file;
    }
    FreecadFile.createFreecadFileWithAssembly = function (vault, filePath, assemblyName) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var templatPath, existingContent, zip, documentXml, updatedDocumentXml, newContent;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!filePath.endsWith('.FCStd')) {
                            throw new Error('Le fichier doit avoir une extension .FCStd');
                        }
                        templatPath = vault.settings.templateFolder + "/FreecadTemplate.FCStd";
                        return [4 /*yield*/, (0, Modals_1.selectMedia)(vault, "Sélectionner le modèle FreeCAD", ["fcstd"], vault.settings.templateFolder).then(function (file) {
                                if (!file) {
                                    throw new Error("Aucun modèle FreeCAD sélectionné.");
                                }
                                templatPath = file.path;
                            })];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, vault.app.vault.adapter.readBinary(templatPath)];
                    case 2:
                        existingContent = _b.sent();
                        return [4 /*yield*/, JSZip.loadAsync(existingContent)];
                    case 3:
                        zip = _b.sent();
                        return [4 /*yield*/, ((_a = zip.file("Document.xml")) === null || _a === void 0 ? void 0 : _a.async("string"))];
                    case 4:
                        documentXml = _b.sent();
                        if (!documentXml)
                            throw new Error("Document.xml introuvable dans le fichier existant.");
                        updatedDocumentXml = documentXml.replace("$AssemblyName$", assemblyName);
                        zip.file("Document.xml", updatedDocumentXml);
                        return [4 /*yield*/, zip.generateAsync({ type: "uint8array" })];
                    case 5:
                        newContent = _b.sent();
                        // Écrire le nouveau fichier (vous pouvez choisir un nouveau chemin si besoin)
                        console.log("Writing FreeCAD file to:", filePath);
                        return [4 /*yield*/, vault.app.vault.adapter.writeBinary(filePath, newContent)];
                    case 6:
                        _b.sent();
                        return [2 /*return*/, Promise.resolve()];
                }
            });
        });
    };
    FreecadFile.prototype.checkUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stat;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.jsonData === null)) return [3 /*break*/, 2];
                        // Set json data 
                        return [4 /*yield*/, this.generateJsonData()];
                    case 1:
                        // Set json data 
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2: return [4 /*yield*/, this.vault.app.vault.adapter.stat(this.file.path)];
                    case 3:
                        stat = _a.sent();
                        if (stat && this.lastCheck && this.lastCheck.toISOString() === new Date(stat.mtime).toISOString()) {
                            return [2 /*return*/, false];
                        }
                        // Update the last check time using ISO date format
                        if (stat && stat.mtime !== undefined) {
                            this.lastCheck = new Date(stat.mtime);
                        }
                        return [4 /*yield*/, this.generateJsonData()];
                    case 4:
                        _a.sent();
                        console.log("Le fichier a été modifié depuis la dernière vérification.");
                        return [2 /*return*/, true];
                }
            });
        });
    };
    FreecadFile.prototype.generateJsonData = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var data, zip, docXml, parser, doc, stat, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        data = this.vault.app.vault.adapter.readBinary(this.file.path);
                        return [4 /*yield*/, JSZip.loadAsync(data)];
                    case 1:
                        zip = _b.sent();
                        return [4 /*yield*/, ((_a = zip.file('Document.xml')) === null || _a === void 0 ? void 0 : _a.async('text'))];
                    case 2:
                        docXml = _b.sent();
                        if (!docXml) {
                            new App_1.Notice('Document.xml non trouvé dans le fichier FreeCAD.');
                            return [2 /*return*/, []];
                        }
                        parser = new fast_xml_parser_1.XMLParser({
                            ignoreAttributes: false,
                            attributeNamePrefix: ''
                        });
                        doc = parser.parse(docXml);
                        this.jsonData = this.reorderJsonData(doc);
                        return [4 /*yield*/, this.vault.app.vault.adapter.stat(this.file.path)];
                    case 3:
                        stat = _b.sent();
                        this.lastCheck = new Date(stat.mtime);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        console.error("Erreur lors de la génération des données JSON :", error_1);
                        throw new Error('Erreur lors de la génération des données JSON du fichier FreeCAD.');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    FreecadFile.prototype.isReady = function () {
        return this.jsonData !== null;
    };
    FreecadFile.prototype.convertPathtoLink = function (path) {
        var _a;
        if (!path) {
            return "";
        }
        // Convertit le chemin en utilisant le basePath du vault
        var vaultBasePath = (0, path_1.normalize)(this.vault.app.vault.adapter.basePath || "").replace(/\\/g, "/");
        if (path && path.toLowerCase().startsWith(vaultBasePath.toLowerCase())) {
            path = path.substring(vaultBasePath.length).replace(/^[/\\]+/, "");
        }
        return "[[".concat(path, "|").concat((_a = path === null || path === void 0 ? void 0 : path.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split("\\").pop(), "]]");
    };
    FreecadFile.prototype.reorderJsonData = function (doc) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
        // Reorder the JSON data to have a consistent structure
        var objects = Array.isArray(doc.Document.Objects.Object) ? doc.Document.Objects.Object : [doc.Document.Objects.Object];
        var objectData = Array.isArray(doc.Document.ObjectData.Object) ? doc.Document.ObjectData.Object : [doc.Document.ObjectData.Object];
        console.log("Objet FreeCAD :", objects);
        console.log("Objet Data FreeCAD :", objectData);
        if (objects.length !== objectData.length) {
            throw Error("Le nombre d'objets et de données d'objets ne correspond pas.");
        }
        var data = {};
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            var properties = objectData[i].Properties.Property || [];
            var name_1 = ((_b = (_a = properties.find(function (prop) { return prop.name === "Label"; })) === null || _a === void 0 ? void 0 : _a.String) === null || _b === void 0 ? void 0 : _b.value) || obj.name;
            if (((_d = (_c = properties.find(function (prop) { return prop.name === "Hidden"; })) === null || _c === void 0 ? void 0 : _c.Bool) === null || _d === void 0 ? void 0 : _d.value) === "true") {
                // Si l'objet est caché, on ne l'ajoute pas aux données
                continue;
            }
            var modelPath = ((_f = (_e = properties.find(function (prop) { return prop.name === "GLBPath"; })) === null || _e === void 0 ? void 0 : _e.String) === null || _f === void 0 ? void 0 : _f.value) || "";
            var values = void 0;
            // Part design objects
            if (obj.type == "PartDesign::Body" || obj.type == "Part::Feature") {
                values = {
                    type: obj.type,
                    objectName: obj.name,
                    material: ((_h = (_g = properties.find(function (prop) { return prop.name === "MaterialName"; })) === null || _g === void 0 ? void 0 : _g.String) === null || _h === void 0 ? void 0 : _h.value) || "",
                    model: this.convertPathtoLink(modelPath),
                    number: 1,
                    code: this.normalizeName(name_1),
                    dimensions: ((_k = (_j = properties.find(function (prop) { return prop.name === "Dimensions"; })) === null || _j === void 0 ? void 0 : _j.String) === null || _k === void 0 ? void 0 : _k.value) || "",
                    svg: this.convertPathtoLink((_m = (_l = properties.find(function (prop) { return prop.name === "SVGPath"; })) === null || _l === void 0 ? void 0 : _l.String) === null || _m === void 0 ? void 0 : _m.value)
                };
            }
            // Assemblies objects
            else if (obj.type == "Assembly::AssemblyObject") {
                var group = ((_o = properties.find(function (prop) { return prop.name === "Group"; })) === null || _o === void 0 ? void 0 : _o.LinkList.Link) || "";
                values = {
                    type: obj.type,
                    objectName: obj.name,
                    model: this.convertPathtoLink(modelPath),
                    group: Array.isArray(group) ? group.map(function (item) { return item.value; }) : [],
                    pieces: {},
                    link: {},
                    number: 1,
                    code: this.normalizeName(name_1)
                };
            }
            // List of assemblies links
            else if (obj.type == "Assembly::AssemblyLink") {
                var xlink = ((_p = properties.find(function (prop) { return prop.name === "LinkedObject"; })) === null || _p === void 0 ? void 0 : _p.XLink) || "";
                var group = ((_r = (_q = properties.find(function (prop) { return prop.name === "Group"; })) === null || _q === void 0 ? void 0 : _q.LinkList) === null || _r === void 0 ? void 0 : _r.Link) || [];
                var fileName = ((_s = xlink.file) === null || _s === void 0 ? void 0 : _s.split("/").pop().split("\\").pop()) || "";
                values = {
                    type: obj.type,
                    objectName: obj.name,
                    path: xlink.file,
                    fileName: fileName || "",
                    assemblyName: xlink.name,
                    number: 1,
                    group: group.map(function (item) { return item.value; }),
                    pieces: {},
                    code: this.normalizeName(name_1)
                };
            }
            // List of parts links
            else if (obj.type == "App::Link") {
                var dataLink = (_u = (_t = properties.find(function (prop) { return prop.name === "DataLink"; })) === null || _t === void 0 ? void 0 : _t.Map) === null || _u === void 0 ? void 0 : _u.Item;
                if (!dataLink) {
                    console.warn("Aucune donnée de lien trouvée pour l'objet :", obj.name);
                    continue;
                }
                var path = ((_v = dataLink.find(function (item) { return item.key === "DocumentPath"; })) === null || _v === void 0 ? void 0 : _v.value) || "";
                var bodyName = ((_w = dataLink.find(function (item) { return item.key === "ObjectName"; })) === null || _w === void 0 ? void 0 : _w.value) || "";
                var fileName = path.split("/").pop().split("\\").pop() || "";
                values = {
                    type: obj.type,
                    objectName: obj.name,
                    path: path,
                    fileName: fileName || "",
                    bodyName: bodyName,
                    number: 1,
                    code: this.normalizeName(name_1)
                };
            }
            // List of folder groups
            else if (obj.type == "App::DocumentObjectGroup") {
                values = {
                    type: obj.type,
                    objectName: obj.name,
                    code: this.normalizeName(name_1),
                    material: ((_y = (_x = properties.find(function (prop) { return prop.name === "Material"; })) === null || _x === void 0 ? void 0 : _x.String) === null || _y === void 0 ? void 0 : _y.value) || ""
                };
            }
            // List of global variables
            else if (obj.type == "App::VarSet") {
                values = {
                    type: obj.type,
                    objectName: obj.name,
                    code: name_1,
                    variables: properties.map(function (prop) { return ({
                        name: prop.name,
                        value: prop.value
                    }); })
                };
            }
            else if (obj.type == "Part::FeaturePython" && (obj.name.startsWith("Screw") || obj.name.startsWith("Nut"))) {
                // special case for screws generated by FreeCAD
                values = {
                    type: "VIS",
                    objectName: obj.name,
                    code: this.normalizeName(name_1),
                    model: this.convertPathtoLink(modelPath) || "",
                    number: 1
                };
            }
            if (values) {
                data[name_1] = values;
            }
        }
        this.fillAssembliesData(data, data);
        // Supprime les clés de data qui contiennent un "_001"
        for (var _i = 0, _z = Object.keys(data); _i < _z.length; _i++) {
            var key = _z[_i];
            if (/_\d{3}$/.test(key)) {
                delete data[key];
            }
            else {
                var normalizedKey = this.normalizeName(key);
                if (normalizedKey !== key && data[normalizedKey] === undefined) {
                    data[normalizedKey] = data[key];
                    delete data[key];
                }
            }
        }
        console.log("Données JSON réordonnées :", data);
        return data;
    };
    /**
     * Réorganise les éléments de data pour qu'ils soient rangés dans "pieces" des assemblages.
     * Cette fonction parcourt tous les objets et place ceux référencés dans les groupes d'assemblages
     * dans la propriété "pieces" correspondante.
     * Retourne un nouvel objet data propre, ne contenant que les éléments racines (non inclus dans un groupe).
     */
    FreecadFile.prototype.fillAssembliesData = function (data, rootData) {
        // Remplir les pièces des assemblages et marquer les inclus
        for (var key in data) {
            var item = data[key];
            if (item.type === "Assembly::AssemblyObject" || item.type === "Assembly::AssemblyLink") {
                if (Array.isArray(item.group)) {
                    for (var _i = 0, _a = item.group; _i < _a.length; _i++) {
                        var groupName = _a[_i];
                        var _b = this.findObjectName(rootData, groupName), foundKey = _b[0], foundObj = _b[1];
                        if (foundKey && foundObj) {
                            var normalized = this.normalizeName(foundKey);
                            if (!item.pieces[normalized]) {
                                item.pieces[normalized] = foundObj;
                            }
                            else {
                                item.pieces[normalized].number += 1;
                                // remove the object from the rootData if it is included in a group
                                if (foundObj.type === "Assembly::AssemblyObject" || foundObj.type === "Assembly::AssemblyLink") {
                                    var _loop_1 = function (itemSup) {
                                        var toSupp = Object.keys(rootData).filter(function (key) { return rootData[key].objectName === itemSup; })[0];
                                        if (toSupp) {
                                            delete rootData[toSupp];
                                        }
                                    };
                                    for (var _c = 0, _d = foundObj.group; _c < _d.length; _c++) {
                                        var itemSup = _d[_c];
                                        _loop_1(itemSup);
                                    }
                                }
                            }
                            if (rootData[foundKey]) {
                                delete rootData[foundKey]; // Supprimer l'élément de la racine s'il est inclus dans un groupe
                            }
                        }
                    }
                }
                // Appel récursif pour les sous-assemblages
                this.fillAssembliesData(item.pieces, rootData);
            }
        }
    };
    FreecadFile.prototype.findObjectName = function (data, objectName) {
        for (var _i = 0, _a = Object.keys(data); _i < _a.length; _i++) {
            var key = _a[_i];
            if (objectName === data[key].objectName) {
                return [key, data[key]];
            }
            if (data[key].pieces) {
                var infos = this.findObjectName(data[key].pieces, objectName);
                if (infos[0] !== null && infos[1] !== null) {
                    return infos;
                }
            }
        }
        return [null, null];
    };
    FreecadFile.prototype.normalizeName = function (name) {
        // Supprime les suffixes du type ' 001', '002', '-001', '-002', etc. à la fin du nom pour la comparaison
        return name.replace(/(\s|_)\d{3}$/, "").replace("_", "").trim();
    };
    FreecadFile.prototype.findExistingObject = function (data, name) {
        for (var key in data) {
            // Supprime les suffixes du type ' 001', ' 002', etc. à la fin du nom pour la comparaison
            if (this.normalizeName(name) === key) {
                return data[key];
            }
            if (["Assembly::AssemblyObject", "Assembly::AssemblyLink"].includes(data[key].type)) {
                var infos = this.findExistingObject(data[key].pieces, name);
                if (infos) {
                    return infos;
                }
            }
        }
        return null;
    };
    FreecadFile.prototype.findReferenceObject = function (data, name, objectName) {
        for (var key in data) {
            if (["Assembly::AssemblyObject", "Assembly::AssemblyLink"].includes(data[key].type)) {
                if (data[key].group.includes(objectName)) {
                    return data[key].pieces;
                }
                var infos = this.findReferenceObject(data[key].pieces, name, objectName);
                if (infos) {
                    return infos;
                }
            }
        }
        return null;
    };
    FreecadFile.prototype.findObjectInData = function (data, name) {
        for (var key in data) {
            if (key === name) {
                return data[key];
            }
            if (data[key].type === "Assembly::AssemblyObject" || data[key].type === "Assembly::AssemblyLink") {
                var found = this.findObjectInData(data[key].pieces, name);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    };
    FreecadFile.prototype.getObjectData = function (name, data) {
        if (this.jsonData === null) {
            console.error('Les données JSON n\'ont pas été générées. Veuillez appeler generateJsonData() d\'abord.');
            return null;
        }
        var object = this.findObjectInData(data ? data : this.jsonData, name);
        if (object) {
            return new FreecadData_1.FreecadData(name, object);
        }
        return null;
    };
    FreecadFile.prototype.getData = function (name) {
        if (name === void 0) { name = ""; }
        if (this.jsonData === null) {
            console.error('Les données JSON n\'ont pas été générées. Veuillez appeler generateJsonData() d\'abord.');
            return [];
        }
        var data = this.jsonData;
        if (name) {
            var element = this.findExistingObject(data, name);
            if (element && element.pieces) {
                data = element.pieces;
            }
            else {
                return element;
            }
        }
        return Object.entries(data)
            .map(function (_a) {
            var name = _a[0], part = _a[1];
            return new FreecadData_1.FreecadData(name, part);
        });
    };
    FreecadFile.prototype.getAllElementsData = function (assemblyName) {
        var _a;
        if (assemblyName === void 0) { assemblyName = ""; }
        if (this.jsonData === null) {
            console.error('Les données JSON n\'ont pas été générées. Veuillez appeler generateJsonData() d\'abord.');
            return [];
        }
        var data = this.jsonData;
        if (assemblyName) {
            var pieces = (_a = this.findExistingObject(data, assemblyName)) === null || _a === void 0 ? void 0 : _a.pieces;
            data = pieces ? pieces : data;
        }
        return Object.entries(data)
            .filter(function (_a) {
            var _ = _a[0], part = _a[1];
            return ["Assembly::AssemblyLink", "Assembly::AssemblyObject", "PartDesign::Body", "App::Link", "VIS", "Part::Feature"].includes(part.type);
        })
            .map(function (_a) {
            var name = _a[0], part = _a[1];
            return new FreecadData_1.FreecadData(name, part);
        });
    };
    return FreecadFile;
}());
exports.FreecadFile = FreecadFile;
