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
exports.ObjectProperty = void 0;
var Property_1 = require("./Property");
var App_1 = require("../App");
var FileProperty_1 = require("./FileProperty");
var ObjectProperty = /** @class */ (function (_super) {
    __extends(ObjectProperty, _super);
    function ObjectProperty(name, properties, args) {
        if (args === void 0) { args = {}; }
        var _this = _super.call(this, name, args) || this;
        _this.type = "object";
        _this.flexSpan = 2;
        _this.appendFirst = false;
        _this.allowMove = true;
        _this.display = "object"; // Can be "object", "table" or "list"
        _this.appendFirst = (args === null || args === void 0 ? void 0 : args.appendFirst) || false;
        _this.properties = properties;
        _this.allowMove = (args === null || args === void 0 ? void 0 : args.allowMove) || true;
        // Assign any additional arguments to the instance
        Object.assign(_this, args);
        return _this;
    }
    ObjectProperty.prototype.getClasses = function () {
        for (var _i = 0, _a = Object.values(this.properties); _i < _a.length; _i++) {
            var prop = _a[_i];
            if (prop instanceof FileProperty_1.FileProperty || prop instanceof ObjectProperty || prop.type == "multiFile") {
                return prop.getClasses();
            }
        }
        throw new Error("No class found");
    };
    // Used by the ClasseProperty to get the parent file
    ObjectProperty.prototype.getParentValue = function (values) {
        if (values && values.length) {
            for (var _i = 0, _a = Object.values(this.properties); _i < _a.length; _i++) {
                var prop = _a[_i];
                if (prop instanceof FileProperty_1.FileProperty || prop instanceof ObjectProperty || prop.type == "multiFile") {
                    return prop.getParentValue(values[0][prop.name]);
                }
            }
        }
    };
    ObjectProperty.prototype.findValue = function (file, value, propertyName) {
        var values = this.read(file);
        if (values && values.length) {
            for (var i = 0; i < values.length; i++) {
                for (var _i = 0, _a = Object.values(this.properties); _i < _a.length; _i++) {
                    var prop = _a[_i];
                    var propValue = values[i][prop.name];
                    if (propValue && (propValue == value || (typeof propValue === "string" && propValue.includes(value)))) {
                        return values[i][propertyName];
                    }
                }
            }
        }
        return null;
    };
    ObjectProperty.prototype.getDisplayProperties = function (file, propertyClasseName, propertyName, isStatic) {
        var _this = this;
        if (isStatic === void 0) { isStatic = true; }
        var properties = [];
        this.vault = file.vault;
        var values = this.read(file);
        if (!(propertyName in this.properties)) {
            throw new Error("Property " + propertyName + " not found in ObjectProperty " + this.name);
        }
        var property = this.properties[propertyName];
        if (values && values.length) {
            var _loop_1 = function (index, row) {
                property.static = isStatic;
                var display = property.fillDisplay(this_1.vault, row[property.name], function (value) { return __awaiter(_this, void 0, void 0, function () {
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.updateObject(values, function (value) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, file.updateMetadata(this.name, value)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                }); }); }, index, property, value)];
                            case 1: return [2 /*return*/, _a.sent()];
                        }
                    });
                }); });
                var classe = this_1.vault.getFromLink(row[this_1.properties[propertyClasseName].name]);
                properties.push({ classe: classe, display: display });
            };
            var this_1 = this;
            for (var _i = 0, _a = values.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], index = _b[0], row = _b[1];
                _loop_1(index, row);
            }
        }
        return properties;
    };
    ObjectProperty.prototype.formatParentValue = function (value) {
        var newObject = {};
        Object.values(this.properties).forEach(function (prop) {
            if (value && prop instanceof FileProperty_1.FileProperty || prop instanceof ObjectProperty || prop.type == "multiFile") {
                newObject[prop.name] = value;
                value = ""; // Only one parent
            }
            else {
                newObject[prop.name] = "";
            }
        });
        return [newObject];
    };
    ObjectProperty.prototype.getDisplay = function (file, args) {
        this.display = (args === null || args === void 0 ? void 0 : args.display) || this.display;
        return _super.prototype.getDisplay.call(this, file, args);
    };
    // Méthode principale pour obtenir l'affichage
    ObjectProperty.prototype.fillDisplay = function (vault, values, update) {
        this.vault = vault;
        var container = document.createElement("div");
        container.classList.add("metadata-object-container-" + this.name.toLowerCase());
        // Créer l'en-tête
        this.createHeader(values, update, container);
        if (this.display == "table") {
            this.createTable(values, update, container);
        }
        else {
            // Affichage par défaut (objet)
            this.createObjects(values, update, container);
        }
        // Créer les lignes d'objet
        return container;
    };
    ObjectProperty.prototype.createTable = function (values, update, container) {
        var _this = this;
        // Créer un tableau pour les objets
        var tableWrapper = document.createElement("div");
        tableWrapper.style.position = "relative";
        container.appendChild(tableWrapper);
        var addButton = this.createAddButton(values, update, container);
        addButton.style.position = "absolute";
        addButton.style.top = "0";
        addButton.style.right = "0";
        tableWrapper.appendChild(addButton);
        var table = document.createElement("table");
        table.classList.add("metadata-object-table");
        tableWrapper.appendChild(table);
        // Créer l'en-tête du tableau
        var headerRow = document.createElement("tr");
        Object.values(this.properties).forEach(function (property) {
            var th = document.createElement("th");
            th.textContent = property.name;
            headerRow.appendChild(th);
        });
        // Ajouter une colonne pour le bouton de suppression
        var thDelete = document.createElement("th");
        headerRow.appendChild(thDelete);
        table.appendChild(headerRow);
        if (values && values.length) {
            // Créer les lignes d'objet
            values.forEach(function (objects, index) {
                var row = document.createElement("tr");
                Object.values(_this.properties).forEach(function (property) {
                    var td = document.createElement("td");
                    td.appendChild(property.fillDisplay(_this.vault, objects[property.name], function (value) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.updateObject(values, update, index, property, value)];
                            case 1: return [2 /*return*/, _a.sent()];
                        }
                    }); }); }));
                    row.appendChild(td);
                });
                // Cellule pour le bouton de suppression
                var tdDelete = document.createElement("td");
                tdDelete.classList.add("metadata-object-delete-cell");
                var deleteButton = _this.createDeleteButton(values, update, index, container);
                deleteButton.classList.add("metadata-object-delete-button");
                tdDelete.appendChild(deleteButton);
                row.appendChild(tdDelete);
                table.appendChild(row);
            });
        }
    };
    // Crée l'en-tête avec les propriétés
    ObjectProperty.prototype.createHeader = function (values, update, container) {
        var headerRow = document.createElement("div");
        headerRow.classList.add("metadata-object-header-row");
        var title = document.createElement("div");
        title.textContent = this.title ? this.title : this.name + " : ";
        title.classList.add("metadata-header");
        headerRow.appendChild(title);
        // Ajouter le bouton d'ajout
        var addButton = this.createAddButton(values, update, container);
        headerRow.appendChild(addButton);
        container.appendChild(headerRow);
    };
    // Crée le bouton d'ajout d'un nouvel objet
    ObjectProperty.prototype.createAddButton = function (values, update, container) {
        var _this = this;
        var addButton = document.createElement("button");
        (0, App_1.setIcon)(addButton, "circle-plus");
        addButton.classList.add("metadata-add-button");
        addButton.onclick = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.addProperty(values, update, container)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); };
        return addButton;
    };
    // Crée les objets et les lignes à afficher
    ObjectProperty.prototype.createObjects = function (values, update, container) {
        var _this = this;
        if (!values) {
            return;
        }
        values.forEach(function (objects, index) {
            var row = _this.createObjectRow(values, update, objects, index, container);
            container.appendChild(row);
        });
        if (this.allowMove) {
            this.enableDragAndDrop(values, update, container);
        }
    };
    // Crée une ligne d'objet avec ses propriétés
    ObjectProperty.prototype.createObjectRow = function (values, update, objects, index, container) {
        var _this = this;
        var row = document.createElement("div");
        row.classList.add("metadata-object-row");
        if (this.allowMove) {
            row.draggable = true;
            row.dataset.index = index.toString();
            row.style.cursor = "grab";
        }
        // Ajouter le bouton de suppression
        var deleteButton = this.createDeleteButton(values, update, index, container);
        deleteButton.style.position = "absolute";
        deleteButton.style.top = "0";
        deleteButton.style.right = "0";
        row.style.position = "relative";
        row.appendChild(deleteButton);
        Object.values(this.properties).forEach(function (property) {
            var value = objects[property.name];
            var propertyContainer = document.createElement("div");
            propertyContainer.classList.add("metadata-object-property");
            if (property.flexSpan) {
                propertyContainer.style.gridColumn = "span " + property.flexSpan;
            }
            var title = document.createElement("div");
            title.textContent = property.name;
            title.classList.add("metadata-title");
            propertyContainer.appendChild(title);
            propertyContainer.appendChild(property.fillDisplay(_this.vault, value, function (value) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObject(values, update, index, property, value)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); }); }));
            row.appendChild(propertyContainer);
        });
        return row;
    };
    // Crée un bouton de suppression pour une ligne d'objet
    ObjectProperty.prototype.createDeleteButton = function (values, update, index, container) {
        var _this = this;
        var deleteButton = document.createElement("button");
        (0, App_1.setIcon)(deleteButton, "circle-minus");
        deleteButton.classList.add("metadata-delete-button");
        deleteButton.onclick = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.removeProperty(values, update, index, container)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); };
        return deleteButton;
    };
    // Gère le glisser-déposer pour réordonner les objets
    ObjectProperty.prototype.enableDragAndDrop = function (values, update, container) {
        var _this = this;
        var draggedElement = null;
        var isEditing = false;
        // Lorsque l'utilisateur clique dans un champ d'édition (input), on active l'édition
        document.addEventListener("focus", function (event) {
            var input = event.target;
            if (input === null || input === void 0 ? void 0 : input.classList.contains('field-input')) {
                isEditing = true; // Le champ est en mode édition
            }
        }, true);
        // Lorsque l'utilisateur quitte un champ d'édition (blur), on désactive l'édition
        document.addEventListener("blur", function (event) {
            var input = event.target;
            if (input === null || input === void 0 ? void 0 : input.classList.contains('field-input')) {
                isEditing = false; // Le champ n'est plus en mode édition
            }
        }, true);
        container.addEventListener("dragstart", function (event) {
            if (isEditing) {
                event.preventDefault();
                return;
            }
            draggedElement = event.target;
            draggedElement.classList.add("dragging");
        });
        container.addEventListener("dragover", function (event) {
            event.preventDefault();
            var afterElement = _this.getDragAfterElement(container, event.clientY);
            if (afterElement == null) {
                container.appendChild(draggedElement);
            }
            else {
                container.insertBefore(draggedElement, afterElement);
            }
        });
        container.addEventListener("dragend", function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!draggedElement)
                            return [2 /*return*/];
                        draggedElement.classList.remove("dragging");
                        // Récupérer le nouvel ordre des éléments
                        return [4 /*yield*/, this.updateOrder(values, update, container)];
                    case 1:
                        // Récupérer le nouvel ordre des éléments
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    // Trouver l'élément après lequel insérer (pour le Drag & Drop)
    ObjectProperty.prototype.getDragAfterElement = function (container, y) {
        var draggableElements = Array.from(container.querySelectorAll(".metadata-object-row:not(.dragging)"));
        return draggableElements.reduce(function (closest, child) {
            var box = child.getBoundingClientRect();
            var offset = y - box.top - box.height / 2;
            return offset < 0 && offset > closest.offset ? { offset: offset, element: child } : closest;
        }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    };
    // Met à jour l'ordre des éléments après un glisser-déposer
    ObjectProperty.prototype.updateOrder = function (values, update, container) {
        return __awaiter(this, void 0, void 0, function () {
            var newOrder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Update order");
                        newOrder = [];
                        Array.from(container.querySelectorAll(".metadata-object-row")).forEach(function (row) {
                            // Assurer qu'on travaille avec un HTMLElement pour accéder à dataset
                            if (row instanceof HTMLElement && row.dataset.index) {
                                var index = parseInt(row.dataset.index);
                                newOrder.push(values[index]);
                            }
                        });
                        // Mettre à jour les métadonnées
                        return [4 /*yield*/, update(newOrder)];
                    case 1:
                        // Mettre à jour les métadonnées
                        _a.sent();
                        return [4 /*yield*/, this.reloadObjects(newOrder, update)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Fonction pour supprimer un objet
    ObjectProperty.prototype.removeProperty = function (values, update, index, container) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Remove index : ", index);
                        values.splice(index, 1);
                        return [4 /*yield*/, update(values)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.reloadObjects(values, update)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Fonction pour ajouter un objet
    ObjectProperty.prototype.addProperty = function (values, update, container) {
        return __awaiter(this, void 0, void 0, function () {
            var newObject, _loop_2, this_2, _i, _a, prop;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("Add new");
                        newObject = {};
                        _loop_2 = function (prop) {
                            var defaultValue;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        defaultValue = prop.getDefaultValue(this_2.vault);
                                        console.log("Default value : ", defaultValue);
                                        if (!(Object.values(this_2.properties)[0] == prop && (prop instanceof FileProperty_1.FileProperty))) return [3 /*break*/, 2];
                                        prop.vault = this_2.vault; // Assurez-vous que vault est défini pour le premier FileProperty
                                        return [4 /*yield*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                                                var _this = this;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, prop.handleIconClick(function (value) { return __awaiter(_this, void 0, void 0, function () {
                                                                return __generator(this, function (_a) {
                                                                    resolve(value);
                                                                    console.log("Default value after click : ", value);
                                                                    return [2 /*return*/];
                                                                });
                                                            }); }, new MouseEvent("click"))];
                                                        case 1:
                                                            _a.sent();
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); })];
                                    case 1:
                                        defaultValue = _c.sent();
                                        _c.label = 2;
                                    case 2:
                                        console.log("Default value after click : ", defaultValue);
                                        if (defaultValue == "like-precedent") {
                                            if (values && values.length) {
                                                if (this_2.appendFirst) {
                                                    defaultValue = values[0][prop.name];
                                                }
                                                else {
                                                    defaultValue = values[values.length - 1][prop.name];
                                                }
                                            }
                                            else {
                                                defaultValue = "";
                                            }
                                        }
                                        newObject[prop.name] = defaultValue;
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        _i = 0, _a = Object.values(this.properties);
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        prop = _a[_i];
                        return [5 /*yield**/, _loop_2(prop)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        ;
                        // Valeurs par défaut
                        if (!values) {
                            values = [];
                        }
                        if (this.appendFirst) {
                            values.unshift(newObject);
                        }
                        else {
                            values.push(newObject);
                        }
                        return [4 /*yield*/, update(values)];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, this.reloadObjects(values, update)];
                    case 6:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Mise à jour des métadonnées
    ObjectProperty.prototype.updateObject = function (values, update, index, property, value) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("Update index : ", index);
                        if (values) {
                            values[index][property.name] = value;
                        }
                        else {
                            values = [(_a = {}, _a[property.name] = value, _a)];
                        }
                        console.log("Updated Values : ", values);
                        return [4 /*yield*/, update(values)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.reloadObjects(values, update)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Recharge dynamiquement les objets
    ObjectProperty.prototype.reloadObjects = function (values, update) {
        return __awaiter(this, void 0, void 0, function () {
            var container;
            return __generator(this, function (_a) {
                container = document.querySelector(".metadata-object-container-" + this.name.toLowerCase());
                if (container) {
                    container.innerHTML = "";
                    // Recréer l'en-tête et les objets
                    console.log("Values : ", values);
                    this.createHeader(values, update, container);
                    if (this.display == "table") {
                        this.createTable(values, update, container);
                    }
                    else {
                        // Affichage par défaut (objet)
                        this.createObjects(values, update, container);
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    return ObjectProperty;
}(Property_1.Property));
exports.ObjectProperty = ObjectProperty;
