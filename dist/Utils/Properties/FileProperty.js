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
exports.FileProperty = void 0;
var App_1 = require("../App");
var Modals_1 = require("Utils/Modals/Modals");
var LinkProperty_1 = require("./LinkProperty");
var FileProperty = /** @class */ (function (_super) {
    __extends(FileProperty, _super);
    // Used for property with a single file
    function FileProperty(name, classes, args) {
        if (args === void 0) { args = {}; }
        var _this = _super.call(this, name, args) || this;
        _this.type = "file";
        _this.classes = classes;
        return _this;
    }
    FileProperty.prototype.getClasses = function () {
        return this.classes;
    };
    // Used by the ClasseProperty to get the parent value
    FileProperty.prototype.getParentValue = function (values) {
        return values; // Enlève les [[ et ]]
    };
    FileProperty.prototype.getPretty = function (value) {
        return this.vault.readLinkFile(value);
    };
    FileProperty.prototype.getClasse = function (read) {
        var link = this.read(read);
        if (link) {
            var classe = this.vault.getFromLink(link);
            if (classe) {
                return classe;
            }
        }
    };
    FileProperty.prototype.validate = function (value) {
        // Expression régulière pour détecter les liens Obsidian au format [[...]]
        var regex = /\[\[([^\]]+)\]\]/;
        var match = value.match(regex);
        if (match && match[1]) {
            return "[[".concat(match[1], "]]");
        }
        return "";
    };
    FileProperty.prototype.getLink = function (value, vault) {
        if (vault) {
            this.vault = vault;
        }
        var vaultName = this.vault.app.vault.getName();
        var filePath = this.vault.readLinkFile(value, true);
        // If readLinkFile returned a path and the file exists in the vault, use it.
        if (filePath && this.vault.app.vault.getAbstractFileByPath(filePath)) {
            return "obsidian://open?vault=".concat(encodeURIComponent(vaultName), "&file=").concat(encodeURIComponent(filePath));
        }
        // Fallback: extract the name only from the link
        var nameOnly = this.vault.readLinkFile(value);
        return "obsidian://open?vault=".concat(encodeURIComponent(vaultName), "&file=").concat(encodeURIComponent(nameOnly));
    };
    FileProperty.prototype.createIconContainer = function (update) {
        var _this = this;
        var iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");
        var icon = document.createElement("div");
        (0, App_1.setIcon)(icon, this.icon);
        iconContainer.appendChild(icon);
        if (!this.static) {
            icon.style.cursor = "pointer";
            iconContainer.addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.handleIconClick(update, event)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); }); });
        }
        return iconContainer;
    };
    // Fonction pour gérer le clic sur l'icône
    FileProperty.prototype.handleIconClick = function (update, event) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var selectedFile, link;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, Modals_1.selectFile)(this.vault, this.classes, { hint: "Choisissez un fichier " + this.getClasses().join(" ou ") })];
                    case 1:
                        selectedFile = _b.sent();
                        if (!selectedFile) return [3 /*break*/, 3];
                        return [4 /*yield*/, update(selectedFile.getLink())];
                    case 2:
                        _b.sent();
                        link = (_a = event.target.closest('.metadata-field')) === null || _a === void 0 ? void 0 : _a.querySelector('.field-link');
                        if (link) {
                            link.textContent = selectedFile.getLink().slice(2, -2);
                        }
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Fonction pour gérer le clic sur l'icône
    FileProperty.prototype.modifyField = function (event) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var link, currentField, classe, leaf;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        link = (_a = event.target.closest('.metadata-field')) === null || _a === void 0 ? void 0 : _a.querySelector('.field-link');
                        currentField = link.textContent;
                        if (!currentField) {
                            return [2 /*return*/];
                        }
                        event.preventDefault();
                        classe = this.vault.getFromLink(currentField);
                        if (!classe) return [3 /*break*/, 2];
                        leaf = this.vault.app.workspace.getLeaf();
                        return [4 /*yield*/, leaf.openFile(classe.file)];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        new App_1.Notice("Le fichier ".concat(currentField, ".md n'existe pas"));
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Fonction pour créer le conteneur principal pour l'field
    FileProperty.prototype.createFieldContainerContent = function (update, value) {
        var fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container");
        var currentField = this.getPretty(value);
        var link = document.createElement("a");
        link.href = this.getLink(value);
        link.textContent = currentField || "";
        link.classList.add("field-link");
        link.style.display = "block";
        fieldContainer.appendChild(link);
        return fieldContainer;
    };
    return FileProperty;
}(LinkProperty_1.LinkProperty));
exports.FileProperty = FileProperty;
