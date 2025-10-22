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
exports.__esModule = true;
exports.SubClassProperty = void 0;
var SelectProperty_1 = require("./SelectProperty");
var SubClassProperty = /** @class */ (function (_super) {
    __extends(SubClassProperty, _super);
    function SubClassProperty(name, subClasses, args) {
        if (args === void 0) { args = {}; }
        var _this = _super.call(this, name, subClasses.map(function (subClass) { return ({ name: subClass.getsubClassName(), color: "" }); }), args) || this;
        _this.type = "subClass";
        _this.subClasses = subClasses;
        return _this;
    }
    SubClassProperty.prototype.getSubClassFromName = function (name) {
        var _a;
        return (_a = this.subClasses.find(function (subClass) { return subClass.getsubClassName() === name; })) === null || _a === void 0 ? void 0 : _a.getConstructor();
    };
    SubClassProperty.prototype.getSubClass = function (file) {
        var value = this.read(file);
        return this.subClasses.find(function (subClass) { return subClass.getsubClassName() === value; });
    };
    SubClassProperty.prototype.getSubclassesNames = function () {
        return this.subClasses;
    };
    SubClassProperty.prototype.getSubClassProperty = function (file) {
        var _a;
        var properties = (_a = this.getSubClass(file)) === null || _a === void 0 ? void 0 : _a.getProperties();
        if (properties) {
            return Object.values(properties);
        }
        return [];
    };
    SubClassProperty.prototype.getTopDisplayContent = function (file) {
        var container = document.createElement("div");
        var subClass = this.getSubClass(file);
        if (subClass) {
            container.appendChild(subClass.getTopDisplayContent(file));
        }
        return container;
    };
    return SubClassProperty;
}(SelectProperty_1.SelectProperty));
exports.SubClassProperty = SubClassProperty;
