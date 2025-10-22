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
exports.FreecadData = void 0;
var Data_1 = require("Utils/Data/Data");
var FreecadData = /** @class */ (function (_super) {
    __extends(FreecadData, _super);
    function FreecadData(name, data) {
        if (data === void 0) { data = {}; }
        var _this = _super.call(this, name) || this;
        _this.name = name;
        Object.assign(_this, data);
        _this.Modele3D = data.model || "";
        return _this;
    }
    FreecadData.getClasse = function () {
        return FreecadData.className;
    };
    FreecadData.prototype.getClasse = function () {
        return FreecadData.className;
    };
    FreecadData.className = "FreecadData";
    return FreecadData;
}(Data_1.Data));
exports.FreecadData = FreecadData;
