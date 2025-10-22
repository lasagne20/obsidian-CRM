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
exports.SelectProperty = void 0;
var Property_1 = require("./Property");
var SelectProperty = /** @class */ (function (_super) {
    __extends(SelectProperty, _super);
    function SelectProperty(name, options, args) {
        if (args === void 0) { args = {}; }
        var _this = _super.call(this, name, args) || this;
        _this.type = "select";
        _this.options = options;
        return _this;
    }
    SelectProperty.prototype.fillDisplay = function (vault, value, update) {
        this.vault = vault;
        var field = this.createFieldContainer();
        var fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container-column");
        if (this.title) {
            var header = document.createElement("div");
            header.classList.add("metadata-header");
            header.textContent = this.title;
            fieldContainer.appendChild(header);
        }
        var selectElement = this.createSelectWidget(value, update);
        fieldContainer.appendChild(selectElement);
        field.appendChild(fieldContainer);
        return field;
    };
    // Crée le widget de sélection avec une liste déroulante
    SelectProperty.prototype.createSelectWidget = function (value, update) {
        var _this = this;
        var selectElement = document.createElement("select");
        selectElement.classList.add("select-dropdown");
        // Appliquer la couleur de l'option sélectionnée
        if (value) {
            var selectedOption = this.options.find(function (option) { return option.name === value; });
            if (selectedOption) {
                selectElement.style.backgroundColor = selectedOption.color;
            }
        }
        else {
            if (this.options.length > 0) {
                selectElement.style.backgroundColor = this.options[0].color;
                // Met à jour avec la première valeur de la liste
                update(this.options[0].name);
            }
        }
        // Ajouter les options de la liste
        this.options.forEach(function (option) {
            var optionElement = document.createElement("option");
            optionElement.classList.add("select-dropdown-option");
            optionElement.value = option.name;
            optionElement.textContent = option.name;
            optionElement.style.backgroundColor = option.color;
            // Si la valeur est déjà sélectionnée, l'option sera sélectionnée
            if (option.name === value) {
                optionElement.selected = true;
            }
            selectElement.appendChild(optionElement);
        });
        // Gérer le changement de valeur
        selectElement.addEventListener("change", function (event) { return __awaiter(_this, void 0, void 0, function () {
            var selectedValue, selectedOption;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        selectedValue = event.target.value;
                        selectedOption = this.options.find(function (option) { return option.name === selectedValue; });
                        if (selectedOption) {
                            selectElement.style.backgroundColor = selectedOption.color;
                        }
                        return [4 /*yield*/, update(selectedValue)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // Bloquer l'affichage de la liste si this.static est faux
        if (this.static) {
            selectElement.disabled = true;
        }
        return selectElement;
    };
    return SelectProperty;
}(Property_1.Property));
exports.SelectProperty = SelectProperty;
