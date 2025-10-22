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
exports.__esModule = true;
exports.FormulaProperty = void 0;
var LinkProperty_1 = require("./LinkProperty");
var FormulaProperty = /** @class */ (function (_super) {
    __extends(FormulaProperty, _super);
    function FormulaProperty(name, formula, args) {
        if (args === void 0) { args = { icon: "", static: true, write: false }; }
        var _this = this;
        var _a;
        _this = _super.call(this, name, args) || this;
        _this.type = "formula";
        _this.write = false;
        _this.formula = formula;
        _this.write = (_a = args.write) !== null && _a !== void 0 ? _a : false;
        return _this;
    }
    FormulaProperty.prototype.validate = function (value) {
        return value;
    };
    FormulaProperty.prototype.read = function (file) {
        var _this = this;
        var allProperties = Object.values(file.getAllProperties()).map(function (property) {
            var _a;
            if (property.name !== _this.name) {
                return _a = {},
                    _a[property.name] = file.getMetadataValue(property.name),
                    _a;
            }
            return {};
        }).reduce(function (acc, prop) { return (__assign(__assign({}, acc), prop)); }, {});
        try {
            var sanitizedProperties = Object.keys(allProperties).reduce(function (acc, key) {
                var sanitizedKey = key.replace(/\s+/g, "");
                acc[sanitizedKey] = allProperties[key];
                return acc;
            }, {});
            var formulaContent = "\n                    const properties = ".concat(JSON.stringify(sanitizedProperties), ";\n                    const name = \"").concat(file.getName(false), "\";\n                    const { ").concat(Object.keys(sanitizedProperties).join(", "), " } = properties;\n                    ").concat(this.formula.includes("return") ? "" : "return ").concat(this.formula, ";\n                ");
            var formulaFunction = new Function("vault", "file", formulaContent);
            var value = formulaFunction(file.vault, file);
            if (this.write) {
                var currentValue = file.getMetadataValue(this.name);
                if (currentValue !== value) {
                    file.updateMetadata(this.name, value);
                }
            }
            return value;
        }
        catch (error) {
            if (error instanceof ReferenceError) {
                console.error("Formula error : " + this.formula + "\n\n"
                    + error
                    + "\n\nThis is all the properties available : ", Object.keys(allProperties).join(", "));
            }
            else {
                console.error("Formula error : " + this.formula + "\n\n" + error);
            }
            return null;
        }
    };
    FormulaProperty.prototype.getPretty = function (value) {
        if (!value)
            return value;
        if (typeof value !== "string") {
            console.error("Value is not a string:", value);
            return value;
        }
        // Check if it's a date
        var dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Matches "YYYY-MM-DD"
        if (dateRegex.test(value)) {
            var parsedDate = new Date(value);
            return parsedDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
        }
        if (!isNaN(Number(value)) && Number.isInteger(Number(value))) {
            return Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return value.replace(/^https?:\/\//, "").replace("[[", "").replace("]]", "");
    };
    FormulaProperty.prototype.getLink = function (value) {
        if (!value)
            return value;
        // Check if it's an email
        var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (emailRegex.test(value)) {
            return "mailto:".concat(value);
        }
        // Check if it's an Obsidian link [[...]]
        var obsidianLinkRegex = /\[\[([^\]]+)\]\]/;
        try {
            var match = value.match(obsidianLinkRegex);
            if (match && match[1]) {
                return "obsidian://open?vault=".concat(this.vault.app.vault.getName(), "&file=").concat(encodeURIComponent(this.vault.readLinkFile(match[1], true)[1]));
            }
            // Check if it's a valid URL
            var urlRegex = /^(https?:\/\/)?([a-zA-Z0-9_-]+\.)+[a-zA-Z]{2,6}(\/[a-zA-Z0-9_-]+)*\/?$/;
            if (urlRegex.test(value)) {
                return value.startsWith("http") ? value : "http://".concat(value);
            }
        }
        catch (error) {
            console.error("Error parsing link for ".concat(value, ":"), error);
        }
        return value;
    };
    return FormulaProperty;
}(LinkProperty_1.LinkProperty));
exports.FormulaProperty = FormulaProperty;
