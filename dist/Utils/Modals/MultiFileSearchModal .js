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
exports.MultiFileSearchModal = void 0;
var App_1 = require("../App");
var FileSearchModal_1 = require("./FileSearchModal");
/**
 * Modale pour rechercher et sélectionner plusieurs fichiers dans Obsidian.
 */
var MultiFileSearchModal = /** @class */ (function (_super) {
    __extends(MultiFileSearchModal, _super);
    function MultiFileSearchModal(vault, onChooseMulti, classes, args) {
        if (classes === void 0) { classes = []; }
        if (args === void 0) { args = {}; }
        var _this = _super.call(this, vault, function () { }, classes, args) || this;
        _this.selectedItems = [];
        _this.onChooseMulti = onChooseMulti;
        return _this;
    }
    // Ensure keydown events are handled by adding an event listener in onOpen
    MultiFileSearchModal.prototype.onOpen = function () {
        var _a;
        _super.prototype.onOpen.call(this);
        (_a = this.inputEl) === null || _a === void 0 ? void 0 : _a.addEventListener("keydown", this.onKeyDown.bind(this));
    };
    MultiFileSearchModal.prototype.getItems = function () {
        return _super.prototype.getItems.call(this).filter(function (item) { return (0, App_1.isTFile)(item); }); // Ensure we only return TFile instances
    };
    MultiFileSearchModal.prototype.onKeyDown = function (evt) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function () {
            var activeItem, index, suggestions, fuzzyMatch, file_1;
            return __generator(this, function (_f) {
                if (evt.code === "Space") {
                    evt.preventDefault();
                    activeItem = (_a = this.resultContainerEl) === null || _a === void 0 ? void 0 : _a.querySelector(".suggestion-item.is-selected");
                    if (activeItem) {
                        index = Array.from((_c = (_b = this.resultContainerEl) === null || _b === void 0 ? void 0 : _b.children) !== null && _c !== void 0 ? _c : []).indexOf(activeItem);
                        suggestions = this.getSuggestions((_e = (_d = this.inputEl) === null || _d === void 0 ? void 0 : _d.value) !== null && _e !== void 0 ? _e : "");
                        fuzzyMatch = suggestions[index];
                        file_1 = (fuzzyMatch === null || fuzzyMatch === void 0 ? void 0 : fuzzyMatch.item) && (0, App_1.isTFile)(fuzzyMatch.item) ? fuzzyMatch.item : null;
                        if (file_1) {
                            if (this.selectedItems.includes(file_1)) {
                                this.selectedItems = this.selectedItems.filter(function (f) { return f !== file_1; });
                            }
                            else {
                                this.selectedItems.push(file_1);
                            }
                        }
                        this.renderAllSuggestions();
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    MultiFileSearchModal.prototype.renderSuggestion = function (item, el) {
        _super.prototype.renderSuggestion.call(this, item, el);
        var file = (0, App_1.isTFile)(item.item) ? item.item : null;
        if (file && this.selectedItems.includes(file)) {
            el.classList.add("multi-file-search-modal-selected");
            // Add a check icon if selected
            var icon = document.createElement("span");
            (0, App_1.setIcon)(icon, "circle-check-big");
            icon.style.marginRight = "4px";
            el.prepend(icon);
        }
        else {
            el.classList.remove("multi-file-search-modal-selected");
        }
    };
    // Helper to re-render all suggestions to update selection classes
    MultiFileSearchModal.prototype.renderAllSuggestions = function () {
        var _this = this;
        var _a, _b, _c, _d;
        var suggestionEls = this.getSuggestions((_b = (_a = this.inputEl) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : "");
        Array.from((_d = (_c = this.resultContainerEl) === null || _c === void 0 ? void 0 : _c.children) !== null && _d !== void 0 ? _d : []).forEach(function (el, idx) {
            // Get the currently displayed suggestion item
            var match = suggestionEls[idx];
            if (match) {
                el.textContent = "";
                _this.renderSuggestion(match, el);
            }
        });
    };
    // Override to handle multi-selection on close
    MultiFileSearchModal.prototype.onClose = function () {
        var _this = this;
        var _a;
        (_a = this.inputEl) === null || _a === void 0 ? void 0 : _a.removeEventListener("keydown", this.onKeyDown.bind(this));
        _super.prototype.onClose.call(this);
        setTimeout(function () {
            if (_this.selectedItems.length > 0)
                _this.onChooseMulti(_this.selectedItems);
            else if (_this.choosed && (0, App_1.isTFile)(_this.choosed))
                _this.onChooseMulti([_this.choosed]);
        }, 100);
    };
    return MultiFileSearchModal;
}(FileSearchModal_1.FileSearchModal));
exports.MultiFileSearchModal = MultiFileSearchModal;
