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
exports.PhoneProperty = void 0;
var LinkProperty_1 = require("./LinkProperty");
var PhoneProperty = /** @class */ (function (_super) {
    __extends(PhoneProperty, _super);
    // Used for property hidden for the user
    function PhoneProperty(name, args) {
        if (args === void 0) { args = { icon: "phone" }; }
        var _this = _super.call(this, name, args) || this;
        _this.type = "phone";
        return _this;
    }
    PhoneProperty.prototype.validate = function (phoneNumber) {
        var cleaned = phoneNumber.replace(/[^0-9]/g, "");
        if (cleaned.length !== 10) {
            return "";
        }
        var corrected = cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1.$2.$3.$4.$5");
        return corrected;
    };
    PhoneProperty.prototype.getPretty = function (value) {
        if (!value)
            return value;
        return this.validate(value);
    };
    PhoneProperty.prototype.getLink = function (value) {
        return "callto:".concat(value === null || value === void 0 ? void 0 : value.replace(".", ""));
    };
    return PhoneProperty;
}(LinkProperty_1.LinkProperty));
exports.PhoneProperty = PhoneProperty;
