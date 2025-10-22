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
exports.DateProperty = void 0;
var Property_1 = require("./Property");
var flatpickr_1 = require("flatpickr");
var fr_js_1 = require("flatpickr/dist/l10n/fr.js");
var App_1 = require("../App");
var iconMap = {
    "yesterday": "calendar-arrow-down",
    "today": "calendar-check",
    "tomorrow": "calendar-arrow-up",
    "next-week": "calendar-clock"
};
var DateProperty = /** @class */ (function (_super) {
    __extends(DateProperty, _super);
    function DateProperty(name, quickSelectIcons, args) {
        if (args === void 0) { args = {}; }
        var _this = _super.call(this, name, args) || this;
        _this.type = "date";
        _this.quickSelectIcons = quickSelectIcons;
        return _this;
    }
    // Crée l'affichage du champ date
    DateProperty.prototype.fillDisplay = function (vault, value, update) {
        this.vault = vault;
        var fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container-column");
        var field = document.createElement("div");
        field.classList.add("metadata-field");
        var dateContainer = this.createFieldContainerContent(update, value);
        field.appendChild(dateContainer);
        if (this.title) {
            var header = document.createElement("div");
            header.classList.add("metadata-header");
            header.textContent = this.name;
            fieldContainer.appendChild(header);
        }
        fieldContainer.appendChild(field);
        return fieldContainer;
    };
    // Crée un champ d'input pour la date
    DateProperty.prototype.createFieldDate = function (value, update, link) {
        var _this = this;
        var input = document.createElement("input");
        input.type = "text";
        input.value = value || ""; // Formaté en "YYYY-MM-DD" pour le stockage
        input.classList.add("field-input");
        (0, flatpickr_1["default"])(input, {
            dateFormat: "Y-m-d",
            defaultDate: value || "",
            locale: fr_js_1.French,
            onChange: function (selectedDates) { return __awaiter(_this, void 0, void 0, function () {
                var selectedDate;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            selectedDate = selectedDates[0];
                            if (!selectedDate) return [3 /*break*/, 2];
                            // Met à jour la valeur de l'input avec le format "YYYY-MM-DD"
                            input.value = this.formatDateForStorage(selectedDate);
                            return [4 /*yield*/, this.updateField(update, input, link)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            }); },
            onClose: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            input.value = "";
                            return [4 /*yield*/, this.updateField(update, input, link)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        });
        return input;
    };
    // Crée un lien qui affiche la date (au format "26 février 2025")
    DateProperty.prototype.createFieldLink = function (value) {
        var _this = this;
        var link = document.createElement("div");
        link.textContent = value ? this.formatDateForDisplay(value) : "Aucune date sélectionnée";
        link.classList.add("date-field-link");
        link.classList.add("field-link");
        link.style.cursor = "pointer";
        link.addEventListener("click", function (event) { return _this.modifyField(event); });
        return link;
    };
    // Formate la date pour l'affichage : "26 février 2025"
    DateProperty.prototype.formatDateForDisplay = function (date) {
        var parsedDate = new Date(date);
        return parsedDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };
    // Formate la date pour le stockage : "YYYY-MM-DD"
    DateProperty.prototype.formatDateForStorage = function (date) {
        return date.toLocaleDateString("fr-CA"); // Utilise la locale "fr-CA" qui renvoie "YYYY-MM-DD"
    };
    // Ajoute les options "Aujourd'hui", "Demain", "Semaine prochaine"
    DateProperty.prototype.createQuickSelect = function (value, update, link, input) {
        var _this = this;
        var quickSelectContainer = document.createElement("div");
        quickSelectContainer.classList.add("quick-select-container");
        this.quickSelectIcons.forEach(function (option) {
            var button = document.createElement("button");
            (0, App_1.setIcon)(button, iconMap[option]);
            button.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
                var date;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            date = this.getDateForOption(option);
                            return [4 /*yield*/, update(this.formatDateForStorage(date))];
                        case 1:
                            _a.sent();
                            link.textContent = this.formatDateForDisplay(this.formatDateForStorage(date));
                            link.style.display = "block";
                            input.style.display = "none";
                            return [2 /*return*/];
                    }
                });
            }); });
            quickSelectContainer.appendChild(button);
        });
        return quickSelectContainer;
    };
    DateProperty.prototype.getDefaultValue = function () {
        return this.formatDateForStorage(this.getDateForOption(this["default"]));
    };
    DateProperty.prototype.getDateForOption = function (option) {
        var today = new Date();
        switch (option) {
            case "yesterday": return new Date(today.setDate(today.getDate() - 1));
            case "today": return new Date();
            case "tomorrow": return new Date(today.setDate(today.getDate() + 1));
            case "next-week": return new Date(today.setDate(today.getDate() + 7));
            case "2-week": return new Date(today.setDate(today.getDate() + 14));
            default: return today;
        }
    };
    // Crée un conteneur pour afficher la date et la sélection rapide
    DateProperty.prototype.createFieldContainerContent = function (update, value) {
        var fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container");
        fieldContainer.classList.add("metadata-field");
        var currentField = value;
        var link = this.createFieldLink(currentField);
        var input = this.createFieldDate(currentField, update, link);
        // Affichage initial : Si la date existe, afficher le lien
        if (currentField && this.validate(value)) {
            link.style.display = "block";
            input.style.display = "none";
        }
        else {
            input.style.display = "block";
            link.style.display = "none";
        }
        // Créer un conteneur avec les boutons de sélection rapide
        var quickSelectContainer = this.createQuickSelect(currentField, update, link, input);
        fieldContainer.appendChild(link);
        fieldContainer.appendChild(input);
        fieldContainer.appendChild(quickSelectContainer);
        return fieldContainer;
    };
    // Met à jour la valeur de la date et bascule l'affichage entre le lien et l'input
    DateProperty.prototype.updateField = function (update, input, link) {
        return __awaiter(this, void 0, void 0, function () {
            var value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        value = this.validate(input.value);
                        if (!value) return [3 /*break*/, 2];
                        return [4 /*yield*/, update(value)];
                    case 1:
                        _a.sent(); // Met à jour avec la date au format "YYYY-MM-DD"
                        input.style.display = "none";
                        link.textContent = this.formatDateForDisplay(value); // Affichage avec le mois en lettres
                        link.style.display = "block";
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, update(input.value)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return DateProperty;
}(Property_1.Property));
exports.DateProperty = DateProperty;
