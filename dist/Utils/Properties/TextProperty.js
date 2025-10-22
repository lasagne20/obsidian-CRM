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
exports.TextProperty = void 0;
var Property_1 = require("./Property");
var App_1 = require("../App");
var TextProperty = /** @class */ (function (_super) {
    __extends(TextProperty, _super);
    function TextProperty(name, args) {
        if (args === void 0) { args = {}; }
        var _this = _super.call(this, name, args) || this;
        _this.type = "text";
        return _this;
    }
    TextProperty.prototype.createFieldInput = function (value) {
        var _this = this;
        var textarea = document.createElement("textarea");
        textarea.value = value || "";
        textarea.classList.add("field-textarea");
        textarea.rows = 4; // Default number of rows
        textarea.style.resize = "vertical"; // Allow vertical resizing
        // Add autocomplete functionality
        textarea.setAttribute("data-keydown-listener", "false");
        textarea.addEventListener("input", function () { return _this.handleAutocomplete(textarea); });
        return textarea;
    };
    TextProperty.prototype.createFieldContainer = function () {
        var field = document.createElement("div");
        field.classList.add("metadata-textfield");
        return field;
    };
    TextProperty.prototype.createFieldLink = function (value) {
        var _this = this;
        var link = document.createElement("div");
        link.innerHTML = value
            ? value.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, function (_, path, alias) {
                var display = alias || path;
                return "<strong><a href=\"#\">".concat(display, "</a></strong>");
            })
            : "";
        link.classList.add("field-textlink");
        link.style.cursor = this.static ? "default" : "text";
        if (!this.static) {
            link.addEventListener("click", function (event) { return _this.modifyField(event); });
        }
        // Add click event for links
        link.querySelectorAll("a").forEach(function (anchor) {
            anchor.addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () {
                var target, classe, leaf;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            event.preventDefault();
                            target = event.target.textContent;
                            if (!target) return [3 /*break*/, 3];
                            classe = this.vault.getFromLink(target);
                            if (!classe) return [3 /*break*/, 2];
                            leaf = this.vault.app.workspace.getLeaf();
                            return [4 /*yield*/, leaf.openFile(classe.file)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            new App_1.Notice("Le fichier ".concat(target, ".md n'existe pas"));
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
        });
        return link;
    };
    TextProperty.prototype.modifyField = function (event) {
        var _a, _b;
        var link = (_a = event.target.closest('.metadata-textfield')) === null || _a === void 0 ? void 0 : _a.querySelector('.field-textlink');
        var input = (_b = event.target.closest('.metadata-textfield')) === null || _b === void 0 ? void 0 : _b.querySelector('.field-textarea');
        if (link && input) {
            link.style.display = "none";
            input.style.display = "block";
            input.focus();
        }
    };
    TextProperty.prototype.handleFieldInput = function (update, input, link) {
        var _this = this;
        input.addEventListener("blur", function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!((_a = input.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector(".autocomplete-dropdown"))) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.updateField(update, input, link)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                    case 2: return [2 /*return*/];
                }
            });
        }); });
        input.addEventListener("keydown", function (event) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(event.key === "Escape")) return [3 /*break*/, 2];
                        event.preventDefault();
                        return [4 /*yield*/, this.updateField(update, input, link)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); });
    };
    TextProperty.prototype.handleAutocomplete = function (textarea) {
        var _this = this;
        var _a, _b;
        var dropdown = (_a = textarea.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector(".autocomplete-dropdown");
        // Remove existing dropdown if present
        if (dropdown) {
            dropdown.remove();
        }
        dropdown = document.createElement("div");
        dropdown.classList.add("autocomplete-dropdown");
        var cursorPosition = textarea.selectionStart || 0;
        var textBeforeCursor = textarea.value.substring(0, cursorPosition);
        var lastWordMatch = textBeforeCursor.match(/(\S+)$/);
        var query = lastWordMatch ? lastWordMatch[0].toLowerCase() : "";
        if (!query) {
            return; // No query, don't show the dropdown
        }
        var files = this.vault.app.vault.getFiles();
        var suggestions = files.filter(function (file) { var _a, _b, _c; return ((_a = file.basename) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(query)) && ((_c = (_b = _this.vault.app.metadataCache.getFileCache(file)) === null || _b === void 0 ? void 0 : _b.frontmatter) === null || _c === void 0 ? void 0 : _c.Classe); });
        if (suggestions.length === 0) {
            return; // No suggestions, don't show the dropdown
        }
        // Calculate the position of the word being edited
        var textBeforeWord = textBeforeCursor.substring(0, (lastWordMatch === null || lastWordMatch === void 0 ? void 0 : lastWordMatch.index) || 0);
        var tempSpan = document.createElement("span");
        tempSpan.style.visibility = "hidden";
        tempSpan.style.whiteSpace = "pre-wrap";
        tempSpan.style.position = "absolute";
        tempSpan.style.font = window.getComputedStyle(textarea).font;
        tempSpan.textContent = textBeforeWord;
        document.body.appendChild(tempSpan);
        var rect = tempSpan.getBoundingClientRect();
        var textareaRect = textarea.getBoundingClientRect();
        dropdown.style.top = "".concat(textareaRect.top + rect.height + window.scrollY, "px");
        dropdown.style.left = "".concat(textareaRect.left + rect.width + window.scrollX, "px");
        dropdown.style.width = "".concat(textareaRect.width, "px");
        document.body.removeChild(tempSpan);
        suggestions.forEach(function (file, index) {
            var item = document.createElement("div");
            item.classList.add("autocomplete-item");
            item.textContent = file.basename || file.name;
            item.tabIndex = 0; // Make it focusable
            item.dataset.index = index.toString();
            item.addEventListener("click", function () {
                _this.insertSuggestion(textarea, "[[".concat(file.path, "|").concat(file.basename, "]]"), (lastWordMatch === null || lastWordMatch === void 0 ? void 0 : lastWordMatch.index) || 0, query.length);
                dropdown.remove();
            });
            dropdown.appendChild(item);
        });
        (_b = textarea.parentElement) === null || _b === void 0 ? void 0 : _b.appendChild(dropdown);
        // Adjust the parent's style to position the dropdown correctly
        var parent = textarea.parentElement;
        parent.style.position = "flex";
        parent.style.flexDirection = "column";
        var selectedIndex = -1;
        var updateSelection = function (newIndex) {
            var items = dropdown.querySelectorAll(".autocomplete-item");
            if (selectedIndex >= 0) {
                items[selectedIndex].classList.remove("selected");
            }
            selectedIndex = newIndex;
            if (selectedIndex >= 0 && selectedIndex < items.length) {
                items[selectedIndex].classList.add("selected");
                items[selectedIndex].scrollIntoView({ block: "nearest" });
            }
        };
        var handleKeyDown = function (event) {
            var items = dropdown.querySelectorAll(".autocomplete-item");
            if (event.key === "ArrowDown") {
                event.preventDefault();
                updateSelection((selectedIndex + 1) % items.length);
            }
            else if (event.key === "ArrowUp") {
                event.preventDefault();
                updateSelection((selectedIndex - 1 + items.length) % items.length);
            }
            else if (event.key === "Escape") {
                dropdown.remove();
                textarea.removeEventListener("keydown", handleKeyDown); // Clean up event listener
                textarea.removeEventListener("keydown", handleEnter);
            }
        };
        var isEnterHandled = false;
        var handleEnter = function (event) {
            var items = dropdown.querySelectorAll(".autocomplete-item");
            if (event.key === "Enter") {
                if (isEnterHandled)
                    return; // Empêche l'exécution multiple
                isEnterHandled = true;
                textarea.removeEventListener("keydown", handleKeyDown);
                textarea.removeEventListener("keydown", handleEnter);
                dropdown.remove();
                event.preventDefault();
                var items_1 = dropdown.querySelectorAll(".autocomplete-item");
                if (selectedIndex >= 0 && selectedIndex < items_1.length) {
                    var selectedItem = items_1[selectedIndex];
                    var suggestion = selectedItem.textContent || "";
                    _this.insertSuggestion(textarea, "[[".concat(suggestion, "]]"), (lastWordMatch === null || lastWordMatch === void 0 ? void 0 : lastWordMatch.index) || 0, query.length);
                }
            }
        };
        if (!textarea.hasAttribute("data-keydown-listener")) {
            textarea.addEventListener("keydown", handleKeyDown);
            textarea.addEventListener("keydown", handleEnter);
            textarea.setAttribute("data-keydown-listener", "true");
        }
        var removeDropdown = function () {
            dropdown.remove();
            textarea.removeEventListener("keydown", handleKeyDown);
        };
        document.addEventListener("click", function (event) {
            if (!dropdown.contains(event.target) && event.target !== textarea) {
                removeDropdown();
            }
        }, { once: true });
    };
    TextProperty.prototype.insertSuggestion = function (textarea, suggestion, startIndex, queryLength) {
        console.log(textarea, suggestion, startIndex, queryLength);
        var before = textarea.value.substring(0, startIndex);
        var after = textarea.value.substring(startIndex + queryLength);
        textarea.value = "".concat(before).concat(suggestion).concat(after);
        textarea.setSelectionRange(before.length + suggestion.length, before.length + suggestion.length);
        textarea.focus();
    };
    return TextProperty;
}(Property_1.Property));
exports.TextProperty = TextProperty;
