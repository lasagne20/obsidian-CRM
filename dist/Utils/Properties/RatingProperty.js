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
exports.RatingProperty = void 0;
var App_1 = require("../App");
var Property_1 = require("./Property");
var RatingProperty = /** @class */ (function (_super) {
    __extends(RatingProperty, _super);
    function RatingProperty(name, args) {
        if (args === void 0) { args = { icon: "star" }; }
        var _this = _super.call(this, name, args) || this;
        _this.type = "rating";
        return _this;
    }
    RatingProperty.prototype.fillDisplay = function (vault, value, update) {
        this.vault = vault;
        var field = this.createFieldContainer();
        var fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container-column");
        var header = document.createElement("div");
        header.classList.add("metadata-header");
        header.textContent = this.name;
        fieldContainer.appendChild(header);
        var stars = this.createStarRating(value, update);
        fieldContainer.appendChild(stars);
        field.appendChild(fieldContainer);
        return field;
    };
    // Fonction pour créer la notation par étoiles (5 étoiles cliquables)
    RatingProperty.prototype.createStarRating = function (value, update) {
        var _this = this;
        var starContainer = document.createElement("div");
        starContainer.classList.add("star-rating");
        var selectedRating = 0;
        if (value) {
            selectedRating = value.length;
        }
        var _loop_1 = function (i) {
            var star = document.createElement("div");
            star.classList.add("star");
            (0, App_1.setIcon)(star, this_1.icon);
            star.setAttribute("data-value", i.toString());
            var svg = star.querySelector("svg");
            if (svg) {
                if (i <= selectedRating) {
                    svg.classList.add("filled-star");
                }
            }
            // Ajout des événements pour l'interaction utilisateur
            star.addEventListener("mouseover", function () { return _this.previewStars(starContainer, i); });
            star.addEventListener("mouseleave", function () { return _this.previewStars(starContainer, selectedRating); });
            star.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            selectedRating = i;
                            return [4 /*yield*/, update('+'.repeat(i))];
                        case 1:
                            _a.sent(); // Sauvegarde en métadonnées sous forme de "+"
                            this.updateStarRating(starContainer, selectedRating);
                            return [2 /*return*/];
                    }
                });
            }); });
            starContainer.appendChild(star);
        };
        var this_1 = this;
        // Crée les 5 étoiles
        for (var i = 1; i <= 5; i++) {
            _loop_1(i);
        }
        this.updateStarRating(starContainer, selectedRating); // Initial update to ensure correct state
        return starContainer;
    };
    // Met à jour l'affichage des étoiles en fonction du niveau actuel
    RatingProperty.prototype.updateStarRating = function (starContainer, rating) {
        var stars = starContainer.querySelectorAll('.star');
        stars.forEach(function (star, index) {
            var svg = star.querySelector("svg");
            if (svg) {
                if (index < rating) {
                    svg.classList.add("filled-star");
                }
                else {
                    svg.classList.remove("filled-star");
                }
            }
        });
    };
    // Prévisualise les étoiles en fonction du survol
    RatingProperty.prototype.previewStars = function (starContainer, rating) {
        var stars = starContainer.querySelectorAll('.star');
        stars.forEach(function (star, index) {
            var svg = star.querySelector("svg");
            if (svg) {
                if (index < rating) {
                    svg.classList.add("hovered-star");
                }
                else {
                    svg.classList.remove("hovered-star");
                }
            }
        });
    };
    return RatingProperty;
}(Property_1.Property));
exports.RatingProperty = RatingProperty;
