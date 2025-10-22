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
exports.MultiFileProperty = void 0;
var ObjectProperty_1 = require("./ObjectProperty");
var FileProperty_1 = require("./FileProperty");
var App_1 = require("../App");
var Modals_1 = require("Utils/Modals/Modals");
var MultiFileProperty = /** @class */ (function (_super) {
    __extends(MultiFileProperty, _super);
    function MultiFileProperty(name, classes, args) {
        if (args === void 0) { args = {}; }
        var _this = _super.call(this, name, {}, args) || this;
        _this.type = "multiFile";
        _this.flexSpan = 2;
        _this.classes = classes;
        _this.property = new FileProperty_1.FileProperty(name, classes, args);
        return _this;
    }
    MultiFileProperty.prototype.getClasses = function () {
        return this.classes;
    };
    MultiFileProperty.prototype.getParentValue = function (values) {
        return this.property.getParentValue(values);
    };
    MultiFileProperty.prototype.formatParentValue = function (value) {
        return [value];
    };
    // Méthode principale pour obtenir l'affichage
    MultiFileProperty.prototype.fillDisplay = function (vault, values, update) {
        this.vault = vault;
        var container = document.createElement("div");
        container.classList.add("metadata-multiFiles-container-" + this.name.toLowerCase());
        container.classList.add("metadata-multiFiles-container");
        // Créer les lignes d'objet
        this.createObjects(values, update, container);
        var addButton = this.createAddButton(values, update, container);
        container.appendChild(addButton);
        return container;
    };
    MultiFileProperty.prototype.createObjects = function (values, update, container) {
        var _this = this;
        if (!values)
            return;
        values.forEach(function (objects, index) {
            var row = _this.createObjectRow(values, update, objects, index, container);
            container.appendChild(row);
        });
    };
    MultiFileProperty.prototype.createObjectRow = function (values, update, value, index, container) {
        var _this = this;
        var row = document.createElement("div");
        row.classList.add("metadata-multiFiles-row-inline");
        // Ajouter le bouton de suppression
        var deleteButton = this.createDeleteButton(values, update, index, container);
        row.appendChild(deleteButton);
        var propertyContainer = document.createElement("div");
        propertyContainer.classList.add("metadata-multiFiles-property-inline");
        propertyContainer.appendChild(this.property.fillDisplay(this.vault, value, function (value) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.updateObject(values, update, index, this.property, value)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); }));
        row.appendChild(propertyContainer);
        return row;
    };
    MultiFileProperty.prototype.createDeleteButton = function (values, update, index, container) {
        var _this = this;
        var deleteButton = document.createElement("button");
        (0, App_1.setIcon)(deleteButton, "minus");
        deleteButton.classList.add("metadata-delete-button-inline-small");
        deleteButton.onclick = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.removeProperty(values, update, index, container)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); };
        return deleteButton;
    };
    MultiFileProperty.prototype.addProperty = function (values, update, container) {
        return __awaiter(this, void 0, void 0, function () {
            var newFiles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, Modals_1.selectMultipleFile)(this.vault, this.classes, { hint: "Choisissez des fichiers " + this.getClasses().join(" ou ") })];
                    case 1:
                        newFiles = _a.sent();
                        if (!(newFiles && newFiles.length > 0)) return [3 /*break*/, 4];
                        if (!values) {
                            values = [];
                        }
                        newFiles.forEach(function (file) {
                            values.push(file.getLink());
                        });
                        return [4 /*yield*/, update(values)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.reloadObjects(values, update)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MultiFileProperty.prototype.createAddButton = function (values, update, container) {
        var _this = this;
        var addButton = document.createElement("button");
        (0, App_1.setIcon)(addButton, "plus");
        addButton.classList.add("metadata-add-button-inline-small");
        addButton.onclick = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.addProperty(values, update, container)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); };
        return addButton;
    };
    MultiFileProperty.prototype.enableDragAndDrop = function () {
        // Disable drag and drop
    };
    return MultiFileProperty;
}(ObjectProperty_1.ObjectProperty));
exports.MultiFileProperty = MultiFileProperty;
