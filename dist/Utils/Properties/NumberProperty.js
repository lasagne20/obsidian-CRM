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
exports.NumberProperty = void 0;
var Property_1 = require("./Property");
var FormulaProperty_1 = require("./FormulaProperty");
var NumberProperty = /** @class */ (function (_super) {
    __extends(NumberProperty, _super);
    function NumberProperty(name, unit, args) {
        if (unit === void 0) { unit = ""; }
        if (args === void 0) { args = { icon: "", static: true }; }
        var _this = _super.call(this, name, args) || this;
        _this.unit = "";
        _this.type = "number";
        _this.formulaProperty = null;
        if (args.formula) {
            _this.formulaProperty = new FormulaProperty_1.FormulaProperty(name, args.formula, { icon: args.icon, static: args.static, write: true });
        }
        _this.unit = unit;
        return _this;
    }
    NumberProperty.prototype.validate = function (value) {
        var numberValue = parseFloat(value);
        if (isNaN(numberValue)) {
            return "";
        }
        return numberValue.toString();
    };
    NumberProperty.prototype.getDisplay = function (file, args) {
        var _this = this;
        if (args === void 0) { args = { staticMode: false, title: "" }; }
        this.static = args.staticMode ? true : this.static;
        this.title = args.title ? args.title : "";
        var value = this.read(file);
        if (!value && this.formulaProperty) {
            value = this.formulaProperty.read(file);
        }
        return this.fillDisplay(file.vault, value, function (value) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, file.updateMetadata(this.name, value)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); });
    };
    NumberProperty.prototype.fillDisplay = function (vault, value, update) {
        this.vault = vault;
        var field = this.createFieldContainer();
        if (this.title) {
            var title = document.createElement("div");
            title.textContent = this.title;
            title.classList.add("metadata-title");
            field.appendChild(title);
        }
        var iconContainer = this.createIconContainer(update);
        var fieldContainer = this.createFieldContainerContent(update, value);
        field.appendChild(iconContainer);
        field.appendChild(fieldContainer);
        return field;
    };
    NumberProperty.prototype.createFieldContainerContent = function (update, value) {
        var fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container");
        var currentField = value;
        var input = this.createFieldInput(currentField);
        var link = this.createFieldLink(currentField);
        if (this.static) {
            link.style.display = "block";
            input.style.display = "none";
        }
        else {
            if (currentField && this.validate(value)) {
                link.style.display = "block";
                input.style.display = "none";
            }
            else {
                input.style.display = "block";
                link.style.display = "none";
            }
        }
        fieldContainer.appendChild(link);
        fieldContainer.appendChild(input);
        if (!this.static) {
            this.handleFieldInput(update, input, link);
        }
        return fieldContainer;
    };
    NumberProperty.prototype.createFieldLink = function (value) {
        var _this = this;
        var link = document.createElement("div");
        link.textContent = value ? "".concat(value, " ").concat(this.unit) : "";
        link.classList.add("field-link");
        link.style.cursor = this.static ? "default" : "text";
        if (!this.static) {
            link.addEventListener("click", function (event) { return _this.modifyField(event); });
        }
        return link;
    };
    NumberProperty.prototype.updateField = function (update, input, link) {
        return __awaiter(this, void 0, void 0, function () {
            var value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        value = input.value;
                        if (!value) return [3 /*break*/, 2];
                        return [4 /*yield*/, update(value)];
                    case 1:
                        _a.sent();
                        input.style.display = "none";
                        link.textContent = value ? "".concat(value, " ").concat(this.unit) : "";
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
    NumberProperty.prototype.createFieldInput = function (value) {
        var input = document.createElement("input");
        input.type = "number";
        input.value = value || "";
        input.classList.add("field-input");
        return input;
    };
    return NumberProperty;
}(Property_1.Property));
exports.NumberProperty = NumberProperty;
