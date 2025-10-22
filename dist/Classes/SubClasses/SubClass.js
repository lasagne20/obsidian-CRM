"use strict";
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
exports.SubClass = void 0;
var Classe_1 = require("Classes/Classe");
var Data_1 = require("Utils/Data/Data");
var uuid_1 = require("uuid");
var SubClass = /** @class */ (function () {
    function SubClass(classe, data) {
        if (data === void 0) { data = null; }
        this.subClassName = "";
        this.subClassIcon = "box";
        this.data = data;
        this.classe = classe;
        this.id = (0, uuid_1.v4)();
    }
    SubClass.prototype.getConstructor = function () {
        return SubClass;
    };
    SubClass.prototype.getsubClassName = function () {
        return this.subClassName;
    };
    SubClass.prototype.getName = function () {
        if (this.data instanceof Data_1.Data) {
            return this.data.getName();
        }
        else if (this.data && this.data["name"]) {
            return this.data["name"];
        }
        return "";
    };
    SubClass.prototype.getLink = function () {
        return "[[".concat(this.getName(), "]]");
    };
    SubClass.prototype.getID = function () {
        return this.id;
    };
    SubClass.prototype.getMetadata = function () {
        if (this.data) {
            return this.data;
        }
    };
    SubClass.prototype.getParent = function () {
        if (this.data && (this.data["parent"] instanceof SubClass || this.data["parent"] instanceof Classe_1.Classe)) {
            return this.data["parent"];
        }
        return null;
    };
    SubClass.prototype.getProperty = function (name) {
        if (Object.keys(this.getAllProperties()).contains(name)) {
            return [this, this.getAllProperties()[name]];
        }
        if (name.startsWith("parent.")) {
            var propertyName = name.split(".").slice(1).join(".");
            if (this.data && this.data["parent"] instanceof SubClass) {
                var parent_1 = this.data["parent"];
                return parent_1.getProperty(propertyName);
            }
        }
        return [this, null];
    };
    SubClass.prototype.populate = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    SubClass.prototype.updateParent = function (vault) {
        this.vault = vault;
        if (this.data && (this.data["parent"] instanceof Data_1.Data)) {
            var parentClassName = this.data["parent"].getClasse();
            if (typeof parentClassName !== 'string') {
                throw new Error('Parent class name must be a string');
            }
            var _a = vault.getSubClasseFromName(parentClassName), parentClass = _a[0], parentSubClass = _a[1];
            this.data["parent"] = new parentSubClass(parentClass.getConstructor(), this.data["parent"]);
            this.data["parent"].updateParent(vault);
        }
    };
    SubClass.prototype.getMetadataValue = function (name) {
        var metadata = this.getMetadata();
        if (metadata && metadata[name]) {
            return metadata[name];
        }
        return undefined;
    };
    SubClass.prototype.getAllProperties = function () {
        return __assign(__assign({}, this.getConstructor().Properties), this.classe.Properties);
    };
    SubClass.prototype.getProperties = function () {
        return this.getConstructor().Properties;
    };
    SubClass.prototype.update = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    SubClass.prototype.getTopDisplayContent = function (classe) {
        var container = document.createElement("div");
        return container;
    };
    SubClass.prototype.check = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    SubClass.Properties = {};
    return SubClass;
}());
exports.SubClass = SubClass;
