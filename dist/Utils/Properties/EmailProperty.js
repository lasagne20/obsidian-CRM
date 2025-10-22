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
exports.EmailProperty = void 0;
var LinkProperty_1 = require("./LinkProperty");
var EmailProperty = /** @class */ (function (_super) {
    __extends(EmailProperty, _super);
    // Used for property hidden for the user
    function EmailProperty(name, args) {
        if (args === void 0) { args = { icon: "mail" }; }
        var _this = _super.call(this, name, args) || this;
        _this.type = "email";
        return _this;
    }
    EmailProperty.prototype.validate = function (email) {
        var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (emailRegex.test(email)) {
            return email;
        }
        return "";
    };
    EmailProperty.prototype.createFieldContainer = function () {
        var field = document.createElement("div");
        field.classList.add("metadata-field");
        field.classList.add("metadata-field-email");
        return field;
    };
    EmailProperty.prototype.getLink = function (value) {
        return "mailto:".concat(value);
    };
    return EmailProperty;
}(LinkProperty_1.LinkProperty));
exports.EmailProperty = EmailProperty;
