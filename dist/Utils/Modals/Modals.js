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
exports.promptTextInput = exports.selectMedia = exports.selectSubClasses = exports.selectClass = exports.selectMultipleFile = exports.selectFile = void 0;
var App_1 = require("../App");
var FileSearchModal_1 = require("./FileSearchModal");
var SelectModal_1 = require("./SelectModal");
var MyVault_1 = require("Utils/MyVault");
var MediaSearchModal_1 = require("./MediaSearchModal");
var TextInputModal_1 = require("./TextInputModal");
var MultiFileSearchModal_1 = require("./MultiFileSearchModal ");
function selectFile(vault, classes, args) {
    if (args === void 0) { args = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var modal = new FileSearchModal_1.FileSearchModal(vault, function (selectedFile, classe) { return __awaiter(_this, void 0, void 0, function () {
                        var object, file, object;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!(0, App_1.isTFile)(selectedFile)) return [3 /*break*/, 1];
                                    object = vault.getFromFile(selectedFile);
                                    resolve(object);
                                    return [3 /*break*/, 4];
                                case 1:
                                    if (!(typeof selectedFile === "string")) return [3 /*break*/, 3];
                                    return [4 /*yield*/, vault.createFile(classe, selectedFile + ".md", args.classeArgs)];
                                case 2:
                                    file = _a.sent();
                                    if (!file) {
                                        resolve(undefined);
                                        return [2 /*return*/];
                                    }
                                    object = vault.getFromFile(file);
                                    resolve(object);
                                    return [3 /*break*/, 4];
                                case 3:
                                    resolve(undefined);
                                    _a.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); }, classes.map(function (name) { return vault.getClasseFromName(name); }), args);
                    modal.open();
                })];
        });
    });
}
exports.selectFile = selectFile;
function selectMultipleFile(vault, classes, args) {
    if (args === void 0) { args = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var modal = new MultiFileSearchModal_1.MultiFileSearchModal(vault, function (selectedFiles) { return __awaiter(_this, void 0, void 0, function () {
                        var objects;
                        return __generator(this, function (_a) {
                            if (selectedFiles.length > 0 && (0, App_1.isTFile)(selectedFiles[0])) {
                                objects = selectedFiles.map(function (file) { return vault.getFromFile(file); }).filter(function (obj) { return obj !== undefined; });
                                resolve(objects);
                            }
                            else {
                                resolve(undefined);
                            }
                            return [2 /*return*/];
                        });
                    }); }, classes.map(function (name) { return vault.getClasseFromName(name); }), args);
                    modal.open();
                })];
        });
    });
}
exports.selectMultipleFile = selectMultipleFile;
function selectClass(vault, title, classes) {
    if (classes === void 0) { classes = null; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var modal = new SelectModal_1.SelectModal(vault.app, function (classe) {
                        resolve(classe);
                    }, function () { resolve(null); }, classes ? classes : MyVault_1.MyVault.classes, title);
                    modal.open();
                })];
        });
    });
}
exports.selectClass = selectClass;
function selectSubClasses(vault, title, subClasses) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    // Convert subClasses list to a dictionary {name: value}
                    var subClassDict = Object.fromEntries(subClasses.map(function (sc) { return [sc.getsubClassName(), sc]; }));
                    console.log("Subclasses", subClassDict);
                    var modal = new SelectModal_1.SelectModal(vault.app, function (el) { resolve(el); }, function () { resolve(null); }, subClassDict, title);
                    modal.open();
                })];
        });
    });
}
exports.selectSubClasses = selectSubClasses;
function selectMedia(vault, title, extensions, pathFolder) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var modal = new MediaSearchModal_1.MediaSearchModal(vault, function (selectedFile) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if ((0, App_1.isTFile)(selectedFile)) {
                                resolve(selectedFile);
                            }
                            else {
                                resolve(undefined);
                            }
                            return [2 /*return*/];
                        });
                    }); }, title, extensions, pathFolder);
                    modal.open();
                })];
        });
    });
}
exports.selectMedia = selectMedia;
function promptTextInput(vault, title) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var modal = new TextInputModal_1.TextInputModal(vault.app, function (input) {
                        resolve(input);
                    }, title);
                    modal.open();
                })];
        });
    });
}
exports.promptTextInput = promptTextInput;
