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
exports.SelectModal = void 0;
var App_1 = require("../App");
/**
 * Modale pour rechercher et sélectionner un fichier dans Obsidian.
 */
var SelectModal = /** @class */ (function (_super) {
    __extends(SelectModal, _super);
    function SelectModal(app, onChoose, onExit, list, hint) {
        if (hint === void 0) { hint = ""; }
        var _this = _super.call(this, app.realObsidianApp || app) || this;
        _this.onChoose = onChoose;
        _this.onExit = onExit;
        _this.list = list;
        _this.hint = hint;
        _this.choosed = null;
        return _this;
    }
    SelectModal.prototype.onOpen = function () {
        _super.prototype.onOpen.call(this);
        // Crée un div pour afficher le message
        var hintEl = this.containerEl.createDiv("fuzzy-hint");
        hintEl.textContent = this.hint;
        // Ajoute ce div avant la liste des suggestions
        var inputContainer = this.containerEl.querySelector(".prompt");
        if (inputContainer) {
            inputContainer.prepend(hintEl);
        }
    };
    SelectModal.prototype.getItemText = function (item) {
        return item;
    };
    SelectModal.prototype.getItems = function () {
        return Object.keys(this.list);
    };
    SelectModal.prototype.onClose = function () {
        var _this = this;
        _super.prototype.onClose.call(this);
        setTimeout(function () {
            if (!_this.choosed) {
                _this.onExit(_this.choosed);
            }
        }, 100);
    };
    SelectModal.prototype.onChooseItem = function (key, evt) {
        this.choosed = this.list[key];
        this.onChoose(this.choosed);
    };
    return SelectModal;
}(App_1.FuzzySuggestModal));
exports.SelectModal = SelectModal;
