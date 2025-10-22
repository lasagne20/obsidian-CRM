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
exports.LinkProperty = void 0;
var Property_1 = require("./Property");
var App_1 = require("../App");
var LinkProperty = /** @class */ (function (_super) {
    __extends(LinkProperty, _super);
    function LinkProperty(name, args) {
        if (args === void 0) { args = { icon: "square-arrow-out-up-right" }; }
        var _this = _super.call(this, name, args) || this;
        _this.type = "link";
        return _this;
    }
    LinkProperty.prototype.createIconContainer = function (update) {
        var _this = this;
        var iconContainer = _super.prototype.createIconContainer.call(this, update);
        iconContainer.style.cursor = "pointer";
        if (!this.static) {
            iconContainer.addEventListener("click", function (event) { return _this.modifyField(event); });
        }
        return iconContainer;
    };
    LinkProperty.prototype.validate = function (url) {
        // Ajoute le préfixe "http://" si l'URL ne commence pas par http:// ou https://
        var fixedUrl = url.trim();
        // Si le lien ne commence pas par http:// ou https://, ajoute "http://"
        if (!/^https?:\/\//i.test(fixedUrl)) {
            fixedUrl = "http://" + fixedUrl;
        }
        var urlRegex = /^(https?:\/\/)?([a-zA-Z0-9_-]+\.)+[a-zA-Z]{2,6}(\/[a-zA-Z0-9_-]+)*\/?$/;
        if (!urlRegex.test(fixedUrl)) {
            return "";
        }
        return fixedUrl;
    };
    LinkProperty.prototype.getPretty = function (value) {
        if (!value)
            return value;
        try {
            var urlObj = new URL(value);
            // Garde le domaine, puis les premiers segments du chemin si trop long
            var pretty = urlObj.hostname;
            if (urlObj.pathname && urlObj.pathname !== "/") {
                var segments = urlObj.pathname.split("/").filter(Boolean);
                if (segments.length > 2) {
                    pretty += "/" + segments.slice(0, 2).join("/") + "/...";
                }
                else {
                    pretty += urlObj.pathname;
                }
            }
            return pretty;
        }
        catch (_a) {
            // Si ce n'est pas une URL valide, retourne la valeur d'origine sans protocole
            return value.replace(/^https?:\/\//, "");
        }
    };
    // Fonction pour créer le lien de l'field
    LinkProperty.prototype.createFieldLink = function (value) {
        var link = document.createElement("a");
        link.href = this.getLink(value);
        link.textContent = this.getPretty(value) || "";
        link.classList.add("field-link");
        link.addEventListener("contextmenu", function (event) {
            event.preventDefault();
            var value = link.textContent;
            if (value) {
                navigator.clipboard.writeText(value).then(function () {
                    new App_1.Notice("Lien copié dans le presse-papiers");
                });
            }
        });
        return link;
    };
    return LinkProperty;
}(Property_1.Property));
exports.LinkProperty = LinkProperty;
