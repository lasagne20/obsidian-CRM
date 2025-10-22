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
exports.AdressProperty = void 0;
var LinkProperty_1 = require("./LinkProperty");
var AdressProperty = /** @class */ (function (_super) {
    __extends(AdressProperty, _super);
    // Used for property hidden for the user
    function AdressProperty(name, args) {
        if (args === void 0) { args = { icon: "map-pinned" }; }
        var _this = _super.call(this, name, args) || this;
        _this.type = "adress";
        return _this;
    }
    AdressProperty.prototype.validate = function (value) {
        return value;
    };
    AdressProperty.prototype.getLink = function (value) {
        return "https://www.google.com/maps/search/".concat(encodeURIComponent(value));
    };
    return AdressProperty;
}(LinkProperty_1.LinkProperty));
exports.AdressProperty = AdressProperty;
