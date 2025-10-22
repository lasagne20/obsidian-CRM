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
exports.RangeDateProperty = void 0;
var flatpickr_1 = require("flatpickr");
require("flatpickr/dist/l10n/fr.js");
var DateProperty_1 = require("./DateProperty");
var RangeDateProperty = /** @class */ (function (_super) {
    __extends(RangeDateProperty, _super);
    function RangeDateProperty(name, args) {
        if (args === void 0) { args = {}; }
        var _this = _super.call(this, name, [], args) || this;
        _this.type = "dateRange";
        return _this;
    }
    RangeDateProperty.prototype.createFieldDate = function (value, update, link) {
        var _this = this;
        var input = document.createElement("input");
        input.type = "text";
        input.value = value || ""; // Formaté en "YYYY-MM-DD" pour le stockage
        input.classList.add("field-input");
        (0, flatpickr_1["default"])(input, {
            dateFormat: "Y-m-d",
            defaultDate: value || "",
            locale: "fr",
            mode: "range",
            onChange: function (selectedDates) { return __awaiter(_this, void 0, void 0, function () {
                var startDate, endDate;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(selectedDates.length === 2)) return [3 /*break*/, 2];
                            startDate = selectedDates[0];
                            endDate = selectedDates[1];
                            if (!(startDate && endDate)) return [3 /*break*/, 2];
                            // Met à jour la valeur de l'input avec le format "YYYY-MM-DD to YYYY-MM-DD"
                            if (startDate.getTime() === endDate.getTime()) {
                                input.value = this.formatDateForStorage(startDate);
                            }
                            else {
                                input.value = "".concat(this.formatDateForStorage(startDate), " to ").concat(this.formatDateForStorage(endDate));
                            }
                            return [4 /*yield*/, this.updateField(update, input, link)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            }); },
            onClose: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateField(update, input, link)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); }); }
        });
        return input;
    };
    // Crée un lien qui affiche la plage de dates (au format "26 février 2025 au 28 février 2025")
    RangeDateProperty.prototype.createFieldLink = function (value) {
        var _this = this;
        var link = document.createElement("div");
        link.textContent = value ? this.formatDateRangeForDisplay(value) : "Aucune date sélectionnée";
        link.classList.add("date-field-link");
        link.classList.add("field-link");
        link.style.cursor = "pointer";
        link.addEventListener("click", function (event) { return _this.modifyField(event); });
        return link;
    };
    // Formate la plage de dates pour l'affichage : "26 février 2025" ou "26 février 2025 au 28 février 2025"
    RangeDateProperty.prototype.formatDateRangeForDisplay = function (dateRange) {
        var _a = dateRange.split(" to "), startDate = _a[0], endDate = _a[1];
        var formattedStartDate = new Date(startDate).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        if (!endDate) {
            return "".concat(formattedStartDate);
        }
        var formattedEndDate = new Date(endDate).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        return "".concat(formattedStartDate, " au ").concat(formattedEndDate);
    };
    // Crée un conteneur pour afficher la plage de dates et la sélection rapide
    RangeDateProperty.prototype.createFieldContainerContent = function (update, value) {
        var fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container");
        fieldContainer.classList.add("metadata-field");
        var currentField = value;
        var link = this.createFieldLink(currentField);
        var input = this.createFieldDate(currentField, update, link);
        // Affichage initial : Si la plage de dates existe, afficher le lien
        if (currentField && this.validate(value)) {
            link.style.display = "block";
            input.style.display = "none";
        }
        else {
            input.style.display = "block";
            link.style.display = "none";
        }
        fieldContainer.appendChild(link);
        fieldContainer.appendChild(input);
        return fieldContainer;
    };
    // Met à jour la valeur de la plage de dates et bascule l'affichage entre le lien et l'input
    RangeDateProperty.prototype.updateField = function (update, input, link) {
        return __awaiter(this, void 0, void 0, function () {
            var value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        value = this.validate(input.value);
                        if (!value) return [3 /*break*/, 2];
                        return [4 /*yield*/, update(value)];
                    case 1:
                        _a.sent(); // Met à jour avec la plage de dates au format "YYYY-MM-DD to YYYY-MM-DD"
                        input.style.display = "none";
                        link.textContent = this.formatDateRangeForDisplay(value); // Affichage avec le mois en lettres
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
    // Valide la plage de dates au format "YYYY-MM-DD to YYYY-MM-DD"
    RangeDateProperty.prototype.validate = function (value) {
        var dateRangeRegex = /^\d{4}-\d{2}-\d{2}( to \d{4}-\d{2}-\d{2})?$/;
        return dateRangeRegex.test(value) ? value : "";
    };
    // Fonction pour extraire la première date d'une chaîne et la convertir en objet Date
    RangeDateProperty.extractFirstDate = function (dateStr) {
        // Regex pour trouver la première date (ex: "26 janvier 2025")
        var moisMap = {
            "janvier": 0, "fevrier": 1, "mars": 2, "avril": 3, "mai": 4, "juin": 5,
            "juillet": 6, "aout": 7, "septembre": 8, "octobre": 9, "novembre": 10, "décembre": 11
        };
        var regex = /(\d{1,2}) (\w+) (\d{4})/;
        var normalizedDateStr = dateStr.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
        var match = normalizedDateStr.match(regex);
        if (match) {
            var day = match[1], month = match[2], year = match[3];
            var moisIndex = moisMap[month.toLowerCase()];
            if (moisIndex !== undefined) {
                return new Date(parseInt(year), moisIndex, parseInt(day));
            }
        }
        return null;
    };
    ;
    return RangeDateProperty;
}(DateProperty_1.DateProperty));
exports.RangeDateProperty = RangeDateProperty;
