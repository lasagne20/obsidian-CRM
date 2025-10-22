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
exports.MediaSearchModal = void 0;
var FileSearchModal_1 = require("./FileSearchModal");
var MediaSearchModal = /** @class */ (function (_super) {
    __extends(MediaSearchModal, _super);
    function MediaSearchModal(vault, onChoose, hint, extensions, pathFolder) {
        if (hint === void 0) { hint = ""; }
        var _this = _super.call(this, vault, onChoose, [], { hint: hint }) || this;
        _this.extensions = ['png', 'jpg', 'jpeg', 'pdf', 'sla', 'lbrn2', "svg"];
        _this.extensions = extensions ? extensions : _this.extensions;
        _this.pathFolder = pathFolder;
        return _this;
    }
    MediaSearchModal.prototype.getItems = function () {
        var _this = this;
        var allFiles = this.app.vault.getFiles();
        return allFiles.filter(function (file) {
            var matchesExtension = file.extension ? _this.extensions.includes(file.extension) : false;
            var matchesPath = _this.pathFolder ? file.path.startsWith(_this.pathFolder) : true;
            return matchesExtension && matchesPath;
        });
    };
    return MediaSearchModal;
}(FileSearchModal_1.FileSearchModal));
exports.MediaSearchModal = MediaSearchModal;
