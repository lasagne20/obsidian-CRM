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
exports.ClasseProperty = void 0;
var Property_1 = require("./Property");
var App_1 = require("../App");
var ClasseProperty = /** @class */ (function (_super) {
    __extends(ClasseProperty, _super);
    // Used for property hidden for the user
    function ClasseProperty(name, icon) {
        if (icon === void 0) { icon = ""; }
        var _this = _super.call(this, name, { icon: icon }) || this;
        _this.type = "class";
        return _this;
    }
    ClasseProperty.prototype.fillDisplay = function (vault, value, update) {
        this.vault = vault;
        var field = document.createElement("div");
        field.classList.add("metadata-field");
        var label = document.createElement("label");
        label.textContent = value;
        if (this.icon) {
            var icon = document.createElement("div");
            icon.classList.add("icon-container");
            (0, App_1.setIcon)(icon, this.icon);
            field.appendChild(icon);
        }
        field.appendChild(label);
        return field;
    };
    return ClasseProperty;
}(Property_1.Property));
exports.ClasseProperty = ClasseProperty;
