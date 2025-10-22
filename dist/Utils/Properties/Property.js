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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.Property = void 0;
var App_1 = require("../App");
var Classe_1 = require("Classes/Classe");
var SubClass_1 = require("Classes/SubClasses/SubClass");
var Property = /** @class */ (function () {
    function Property(name, options) {
        if (options === void 0) { options = {}; }
        this.flexSpan = 0;
        this.type = "text";
        var _a = options.icon, icon = _a === void 0 ? "align-left" : _a, _b = options.staticProperty, staticProperty = _b === void 0 ? false : _b, _c = options.flexSpan, flexSpan = _c === void 0 ? 1 : _c, _d = options.defaultValue, defaultValue = _d === void 0 ? "" : _d, additionalOptions = __rest(options, ["icon", "staticProperty", "flexSpan", "defaultValue"]);
        this.flexSpan = flexSpan;
        this.name = name;
        this.icon = icon;
        this["default"] = defaultValue;
        this.static = staticProperty;
        // Assign additional options to the instance
        Object.assign(this, additionalOptions);
    }
    Property.prototype.getDefaultValue = function (vault) {
        if (this["default"] == "personalName") {
            return vault.getPersonalName();
        }
        return this["default"];
    };
    Property.prototype.read = function (file) {
        var _a;
        if (file instanceof Classe_1.Classe || file instanceof SubClass_1.SubClass) {
            return file.getMetadataValue(this.name);
        }
        return (_a = file.getMetadata()) === null || _a === void 0 ? void 0 : _a[this.name];
    };
    Property.prototype.check = function (file) {
    };
    Property.prototype.validate = function (value) {
        return value;
    };
    Property.prototype.getLink = function (value) {
        return value;
    };
    Property.prototype.getPretty = function (value) {
        return value;
    };
    Property.prototype.getDisplay = function (file, args) {
        var _this = this;
        if (args === void 0) { args = { staticMode: false, title: "" }; }
        this.static = args.staticMode ? true : this.static;
        this.title = args.title ? args.title : "";
        var value = this.read(file);
        return this.fillDisplay(file.vault, value, function (value) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, file.updateMetadata(this.name, value)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); }, args);
    };
    Property.prototype.fillDisplay = function (vault, value, update, args) {
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
    Property.prototype.createFieldContainer = function () {
        var field = document.createElement("div");
        field.classList.add("metadata-field");
        return field;
    };
    Property.prototype.createIconContainer = function (update) {
        var _this = this;
        var iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");
        if (this.icon) {
            var icon = document.createElement("div");
            (0, App_1.setIcon)(icon, this.icon);
            iconContainer.appendChild(icon);
            if (!this.static) {
                iconContainer.addEventListener("click", function (event) { return _this.modifyField(event); });
            }
        }
        return iconContainer;
    };
    Property.prototype.modifyField = function (event) {
        var _a, _b;
        var link = (_a = event.target.closest('.metadata-field')) === null || _a === void 0 ? void 0 : _a.querySelector('.field-link');
        var input = (_b = event.target.closest('.metadata-field')) === null || _b === void 0 ? void 0 : _b.querySelector('.field-input');
        if (link && input) {
            link.style.display = "none";
            input.style.display = "block";
            input.focus();
        }
    };
    Property.prototype.createFieldContainerContent = function (update, value) {
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
            if (currentField) {
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
    Property.prototype.createFieldLink = function (value) {
        var _this = this;
        var link = document.createElement("div");
        link.textContent = this.getPretty(value) || "";
        link.classList.add("field-link");
        link.style.cursor = this.static ? "default" : "text";
        if (!this.static) {
            link.addEventListener("click", function (event) { return _this.modifyField(event); });
        }
        return link;
    };
    Property.prototype.handleFieldInput = function (update, input, link) {
        var _this = this;
        input.addEventListener("blur", function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateField(update, input, link)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        input.addEventListener("keydown", function (event) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(event.key === "Enter" || event.key === "Escape")) return [3 /*break*/, 2];
                        event.preventDefault();
                        return [4 /*yield*/, this.updateField(update, input, link)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); });
    };
    Property.prototype.createFieldInput = function (value) {
        var input = document.createElement("input");
        input.type = "text";
        input.value = value || "";
        input.classList.add("field-input");
        return input;
    };
    Property.prototype.updateField = function (update, input, link) {
        return __awaiter(this, void 0, void 0, function () {
            var value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        value = this.validate(input.value);
                        if (!value) return [3 /*break*/, 2];
                        return [4 /*yield*/, update(value)];
                    case 1:
                        _a.sent();
                        input.style.display = "none";
                        link.textContent = value;
                        if (link.href) {
                            link.href = this.getLink(value);
                        }
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
    Property.prototype.reloadDynamicContent = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var field, newValue, link, input;
            return __generator(this, function (_a) {
                field = document.querySelector('.metadata-field');
                if (field) {
                    newValue = this.read(file);
                    link = field.querySelector('.field-link');
                    input = field.querySelector('.field-input');
                    if (link && input) {
                        link.textContent = newValue;
                        input.value = newValue;
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    return Property;
}());
exports.Property = Property;
