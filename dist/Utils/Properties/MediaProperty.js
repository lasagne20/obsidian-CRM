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
exports.MediaProperty = void 0;
var FileProperty_1 = require("./FileProperty");
var App_1 = require("../App");
var Modals_1 = require("Utils/Modals/Modals");
var THREE = require("three");
var GLTFLoader_js_1 = require("three/examples/jsm/loaders/GLTFLoader.js");
var OrbitControls_js_1 = require("three/examples/jsm/controls/OrbitControls.js");
var shell = require('electron').shell;
var MediaProperty = /** @class */ (function (_super) {
    __extends(MediaProperty, _super);
    // Used for property with a single file
    function MediaProperty(name, args) {
        if (args === void 0) { args = { icon: "media", create: "" }; }
        var _this = _super.call(this, name, [], args) || this;
        _this.type = "media";
        _this.createOption = args.create || "";
        return _this;
    }
    MediaProperty.prototype.getDisplay = function (file, args) {
        var _this = this;
        if (args === void 0) { args = { staticMode: false, title: "", display: "name" }; }
        this.display = args.display || "name";
        if (!this.read(file) && this.createOption) {
            // If the file is not set, we return a container with a button to create a new file
            var container_1 = document.createElement("div");
            container_1.classList.add("create-freecad-container");
            var button = document.createElement("button");
            button.classList.add("mod-cta");
            if (args.createOptions && args.createOptions.createFunction) {
                button.textContent = args.createOptions.title || "Créer un fichier";
                button.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
                    var path_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!(args.createOptions && typeof args.createOptions.createFunction === "function")) return [3 /*break*/, 4];
                                return [4 /*yield*/, args.createOptions.createFunction()];
                            case 1:
                                path_1 = _a.sent();
                                return [4 /*yield*/, file.updateMetadata(this.name, "[[".concat(path_1, "|").concat(path_1.split("/").pop(), "]]"))];
                            case 2:
                                _a.sent();
                                setTimeout(function () {
                                    var _a, _b, _c;
                                    // On attend 2 secondes pour que le fichier soit créé et déplacer dans le bon dossier avant de l'ouvrir
                                    path_1 = ((_a = file.vault.getMediaFromLink(path_1)) === null || _a === void 0 ? void 0 : _a.path) || path_1;
                                    var vaultPath = file.vault.app.vault.adapter.basePath || ((_c = (_b = file.vault.adapter).getBasePath) === null || _c === void 0 ? void 0 : _c.call(_b));
                                    var absoluteMediaPath = vaultPath ? require('path').join(vaultPath, path_1) : path_1;
                                    shell.openPath(absoluteMediaPath);
                                }, 1000);
                                return [4 /*yield*/, file.check()];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                container_1.appendChild(button);
                return container_1;
            }
        }
        var value = this.read(file);
        var container = this.fillDisplay(file.vault, value, function (value) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, file.updateMetadata(this.name, value)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); }, file);
        if (args.updateOptions && args.updateOptions.updateFunction) {
            var refreshButton = document.createElement("button");
            refreshButton.classList.add("mod-cta");
            (0, App_1.setIcon)(refreshButton, args.updateOptions.icon || "refresh-ccw");
            refreshButton.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
                var path;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(args.updateOptions && typeof args.updateOptions.updateFunction === "function")) return [3 /*break*/, 3];
                            return [4 /*yield*/, args.updateOptions.updateFunction()];
                        case 1:
                            path = _a.sent();
                            return [4 /*yield*/, file.updateMetadata(this.name, "[[".concat(path, "|").concat(path.split("/").pop(), "]]"))];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            container.appendChild(refreshButton);
        }
        return container;
    };
    MediaProperty.prototype.getLink = function (value, vault) {
        var _a;
        if (!value) {
            return "";
        }
        return ((_a = this.vault.getMediaFromLink(value)) === null || _a === void 0 ? void 0 : _a.name) || "";
    };
    MediaProperty.prototype.openFile = function (value) {
        var _a;
        var shell = require('electron').shell;
        // Get the absolute path to the file in the vault
        var vaultPath = this.vault.app.vault.adapter.basePath;
        var mediaPath = (_a = this.vault.getMediaFromLink(value)) === null || _a === void 0 ? void 0 : _a.path;
        var absoluteMediaPath = vaultPath ? require('path').join(vaultPath, mediaPath) : mediaPath;
        shell.openPath(absoluteMediaPath);
    };
    MediaProperty.prototype.fillDisplay = function (vault, value, update, file) {
        var _this = this;
        var _a, _b;
        if (file === void 0) { file = null; }
        this.vault = vault;
        if (value && value.startsWith("[[") && value.endsWith("]]")) {
            if (this.display === "embed") {
                // If it is an image : 
                var mediaPath_1 = (_a = this.vault.getMediaFromLink(value)) === null || _a === void 0 ? void 0 : _a.path;
                var container = document.createElement("div");
                if (mediaPath_1) {
                    var ext = mediaPath_1.toLowerCase().split('.').pop();
                    if (ext && ["png", "jpg", "jpeg", "gif"].includes(ext)) {
                        container = this.createEmbedImageContainer(mediaPath_1, update);
                    }
                    else if (ext && ["glb", "gltf", "fcstd"].includes(ext)) {
                        if (ext === "fcstd") {
                            // try with the name of the file 
                            // Récupère le dossier du fichier courant et construit le chemin GLB relatif
                            var folder = mediaPath_1.substring(0, mediaPath_1.lastIndexOf("/"));
                            var testList = [file.getName(false), file.getMetadataValue("Code"), mediaPath_1.replace(/\.fcstd$/i, ".glb")];
                            if (typeof file.getCode === "function") {
                                testList.push(file.getCode());
                            }
                            for (var _i = 0, testList_1 = testList; _i < testList_1.length; _i++) {
                                var testName = testList_1[_i];
                                mediaPath_1 = folder ? "".concat(folder, "/").concat(testName, ".glb") : "".concat(testName, ".glb");
                                if (this.vault.app.vault.getFiles().find(function (f) { return f.path === mediaPath_1; })) {
                                    break;
                                }
                            }
                        }
                        container = this.createEmbed3DContainer(mediaPath_1, update);
                    }
                    container.style.position = "relative";
                    container.appendChild(this.createEmbedOpenContainer(update, value));
                    container.appendChild(this.createEmbedEditContainer(update, value));
                }
                return container;
            }
            else if (this.display === "icon") {
                var container = document.createElement("div");
                container.classList.add("metadata-field", "media-field");
                var iconDiv = document.createElement("div");
                iconDiv.classList.add("big-icon-div");
                (0, App_1.setIcon)(iconDiv, this.getFileIcon(value));
                var fileName = document.createElement("div");
                fileName.classList.add("media-field-file-name");
                fileName.textContent = ((_b = this.vault.getMediaFromLink(value)) === null || _b === void 0 ? void 0 : _b.name) || "Fichier non trouvé";
                container.appendChild(iconDiv);
                container.appendChild(fileName);
                container.appendChild(iconDiv);
                container.appendChild(fileName);
                // 🔗 Ouvrir le fichier au clic (sur tout le conteneur)
                container.style.cursor = "pointer";
                container.addEventListener("click", function () {
                    _this.openFile(value);
                });
                return container;
            }
            else if (this.display === "button") {
                var container = document.createElement("div");
                container.classList.add("create-freecad-container");
                var button = document.createElement("button");
                button.classList.add("mod-cta");
                button.textContent = this.title || "Ouvrir le fichier";
                button.addEventListener("click", function () {
                    _this.openFile(value);
                });
                container.appendChild(button);
                return container;
            }
        }
        return _super.prototype.fillDisplay.call(this, vault, value, update);
    };
    MediaProperty.prototype.getFileIcon = function (value) {
        var _a;
        if (value && value.startsWith("[[") && value.endsWith("]]")) {
            var mediaPath = (_a = this.vault.getMediaFromLink(value)) === null || _a === void 0 ? void 0 : _a.path;
            if (mediaPath) {
                var ext = mediaPath.toLowerCase().split('.').pop();
                if (ext && ["png", "jpg", "jpeg", "gif"].includes(ext)) {
                    return "image";
                }
                else if (ext && ["glb", "gltf", "fcstd"].includes(ext)) {
                    return "cube3d";
                }
                else if (ext && ["pdf", "docx", "txt"].includes(ext)) {
                    return "file";
                }
                else if (ext && ["mp4", "webm", "ogg"].includes(ext)) {
                    return "video";
                }
                else if (ext && ["mp3", "wav"].includes(ext)) {
                    return "audio";
                }
                else if (ext && ["zip", "rar"].includes(ext)) {
                    return "archive";
                }
                else if (ext && ["sla"].includes(ext)) {
                    return "square-pen";
                }
                else if (ext && ["lbrn2"].includes(ext)) {
                    return "flame";
                }
            }
        }
        return this.icon || "media";
    };
    MediaProperty.prototype.createEmbedEditContainer = function (update, value) {
        var _this = this;
        var container = document.createElement("div");
        container.classList.add("embed-edit-container");
        container.style.position = "absolute"; // Position the icon container absolutely
        container.style.top = "5px"; // Adjust the top position
        container.style.left = "5px"; // Adjust the right position
        container.style.cursor = "pointer"; // Change cursor to pointer
        var iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");
        var icon = document.createElement("i");
        (0, App_1.setIcon)(icon, "link");
        icon.addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.handleIconClick(update, event)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); });
        iconContainer.appendChild(icon);
        container.appendChild(iconContainer);
        return container;
    };
    MediaProperty.prototype.createEmbedOpenContainer = function (update, value) {
        var _this = this;
        var container = document.createElement("div");
        container.classList.add("embed-open-container");
        container.style.position = "absolute"; // Position the icon container absolutely
        container.style.top = "5px"; // Adjust the top position
        container.style.right = "5px"; // Adjust the right position
        container.style.cursor = "pointer"; // Change cursor to pointer
        var iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");
        var icon = document.createElement("i");
        (0, App_1.setIcon)(icon, "external-link");
        icon.addEventListener("click", function (event) {
            event.preventDefault();
            if (value) {
                _this.openFile(value);
            }
            else {
                new App_1.Notice("Unable to generate link for the media.");
            }
        });
        iconContainer.appendChild(icon);
        container.appendChild(iconContainer);
        return container;
    };
    MediaProperty.prototype.createEmbed3DContainer = function (mediaPath, update) {
        var _this = this;
        var container = document.createElement("div");
        container.classList.add("embed-container");
        // Check if the file exists in the vault before trying to load it
        var fileExists = this.vault.app.vault.getFiles().find(function (f) { return f.path === mediaPath; });
        if (!fileExists) {
            var errorDiv = document.createElement("div");
            errorDiv.textContent = "Rendu 3D introuvable.Ouvrer le fichier dans FreeCAD pour le cr\u00E9er.";
            console.error("3D model file not found:", mediaPath);
            errorDiv.style.textAlign = "center";
            errorDiv.style.margin = "40px auto";
            errorDiv.style.color = "#c00";
            container.appendChild(errorDiv);
            return container;
        }
        var embed = document.createElement("canvas");
        embed.classList.add("embed-media");
        container.appendChild(embed);
        var renderer = new THREE.WebGLRenderer({ canvas: embed, alpha: true, antialias: true });
        renderer.setSize(300, 300);
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
        // Position the camera directly above, looking down the -Z axis
        camera.position.set(0, 10, 0);
        camera.up.set(0, 0, -1); // Make Z axis "up" for the camera
        camera.lookAt(0, 0, 0);
        // Add multiple directional lights from different directions for even illumination
        var directions = [
            [0, 10, 0],
            [0, -10, 0],
            [10, 0, 0],
            [-10, 0, 0],
            [0, 0, 10],
            [0, 0, -10], // Back
        ];
        directions.forEach(function (dir) {
            var light = new THREE.DirectionalLight(0xffffff, 1);
            light.position.set(dir[0], dir[1], dir[2]);
            light.target.position.set(0, 0, 0);
            scene.add(light);
            scene.add(light.target);
        });
        // Optionally add a soft ambient light for subtle fill
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        var loader = new GLTFLoader_js_1.GLTFLoader();
        var model;
        var animationActive = true; // Track animation state
        var controls = new OrbitControls_js_1.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // Smooth rotation
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.enableRotate = true;
        controls.minPolarAngle = 0; // Permet toutes les rotations verticales
        controls.maxPolarAngle = Math.PI; // Permet toutes les rotations verticales
        controls.target.set(0, 0, 0);
        loader.load(this.vault.app.vault.adapter.getResourcePath(mediaPath), function (gltf) {
            model = gltf.scene;
            model.traverse(function (child) {
                if (child.isMesh && child.material) {
                    // Handle both array and single material
                    var materials = Array.isArray(child.material) ? child.material : [child.material];
                    for (var _i = 0, materials_1 = materials; _i < materials_1.length; _i++) {
                        var mat = materials_1[_i];
                        if (mat.transparent || mat.opacity < 0.5) {
                            // Set mesh to be fully visible (opaque)
                            mat.opacity = 1;
                            mat.transparent = false;
                        }
                    }
                }
            });
            // Automatically center the model
            var box = new THREE.Box3().setFromObject(model);
            var center = new THREE.Vector3();
            var size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);
            // Center the model at the origin
            model.position.sub(center);
            // Scale model to fill 80% of the 300x300 area
            var maxDim = Math.max(size.x, size.y, size.z);
            var targetFill = 0.8;
            var viewHeight = 2 * camera.position.y * Math.tan((camera.fov * Math.PI) / 360);
            var desiredSize = viewHeight * targetFill;
            var scale = desiredSize / maxDim;
            model.scale.setScalar(scale);
            // Trouver la face la plus grande (dans le plan XZ ou YZ ou XY)
            // On va chercher la direction où la surface projetée est la plus grande
            // et placer la caméra en face de cette direction
            // Calculer les surfaces projetées sur chaque plan
            var sx = size.y * size.z; // surface sur le plan YZ (vue selon X)
            var sy = size.x * size.z; // surface sur le plan XZ (vue selon Y)
            var sz = size.x * size.y; // surface sur le plan XY (vue selon Z)
            // Trouver la plus grande surface et ajuster la caméra
            if (sx >= sy && sx >= sz) {
                // Vue selon X (face YZ)
                camera.position.set(center.x + 10, center.y, center.z);
                camera.up.set(0, 1, 0);
                camera.lookAt(center.x, center.y, center.z);
                controls.target.set(center.x, center.y, center.z);
            }
            else if (sy >= sx && sy >= sz) {
                // Vue selon Y (face XZ)
                camera.position.set(center.x, center.y + 10, center.z);
                camera.up.set(0, 0, -1);
                camera.lookAt(center.x, center.y, center.z);
                controls.target.set(center.x, center.y, center.z);
            }
            else {
                // Vue selon Z (face XY)
                camera.position.set(center.x, center.y, center.z + 10);
                camera.up.set(0, 1, 0);
                camera.lookAt(center.x, center.y, center.z);
                controls.target.set(center.x, center.y, center.z);
            }
            // No rotation: keep model flat for top-down view
            model.rotation.set(0, 0, 0);
            // Ensure model is centered after scaling
            var newBox = new THREE.Box3().setFromObject(model);
            var newCenter = new THREE.Vector3();
            newBox.getCenter(newCenter);
            model.position.sub(newCenter);
            scene.add(model);
            animate();
        }, undefined, function (error) {
            console.error("An error occurred while loading the 3D model:", error);
        });
        function animate() {
            requestAnimationFrame(animate);
            controls.update(); // Update controls for smooth interaction
            renderer.render(scene, camera);
        }
        // Stop animation on click
        embed.addEventListener("mousedown", function () {
            animationActive = false;
        });
        var iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");
        var icon = document.createElement("i");
        icon.classList.add("icon", this.icon);
        icon.addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.handleIconClick(update, event)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); });
        iconContainer.appendChild(icon);
        container.appendChild(iconContainer);
        return container;
    };
    MediaProperty.prototype.createEmbedImageContainer = function (mediaPath, update) {
        var _this = this;
        var container = document.createElement("div");
        container.classList.add("metadata-field", "media-field", "embed-container");
        var embed = document.createElement("img");
        embed.src = this.vault.app.vault.adapter.getResourcePath(mediaPath);
        embed.alt = "Media";
        embed.classList.add("embed-media");
        var iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");
        var icon = document.createElement("i");
        icon.classList.add("icon", this.icon);
        icon.addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.handleIconClick(update, event)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); });
        iconContainer.appendChild(icon);
        container.appendChild(embed);
        container.appendChild(iconContainer);
        return container;
    };
    // Fonction pour gérer le clic sur l'icône
    MediaProperty.prototype.handleIconClick = function (update, event) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var selectedFile, link;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, Modals_1.selectMedia)(this.vault, "Choisissez un document")];
                    case 1:
                        selectedFile = _b.sent();
                        if (!selectedFile) return [3 /*break*/, 3];
                        return [4 /*yield*/, update("[[".concat(selectedFile.path, "|").concat(selectedFile.name, "]]"))];
                    case 2:
                        _b.sent();
                        link = (_a = event.target.closest('.metadata-field')) === null || _a === void 0 ? void 0 : _a.querySelector('.field-link');
                        if (link) {
                            link.textContent = selectedFile.name;
                        }
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Override the createFieldContainerContent function to truncate the link
    MediaProperty.prototype.createFieldContainerContent = function (update, value) {
        var _this = this;
        var fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container");
        var currentField = this.getLink(value);
        var link = document.createElement("a");
        link.href = "#";
        var truncatedField = (currentField === null || currentField === void 0 ? void 0 : currentField.length) > 12 ? currentField.slice(0, 12) + "..." : currentField;
        link.textContent = truncatedField || "";
        link.setAttribute("full-text", currentField || "");
        link.addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.modifyField(event)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); });
        link.classList.add("field-link");
        link.style.display = "block";
        fieldContainer.appendChild(link);
        return fieldContainer;
    };
    // Fonction pour gérer le clic sur l'icône
    MediaProperty.prototype.modifyField = function (event) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var link, currentField, file, leaf;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        link = (_a = event.target.closest('.metadata-field')) === null || _a === void 0 ? void 0 : _a.querySelector('.field-link');
                        currentField = link.getAttribute("full-text");
                        if (!currentField) {
                            return [2 /*return*/];
                        }
                        event.preventDefault();
                        file = this.vault.app.vault.getFiles().find(function (f) { return f.name === currentField; });
                        if (!file) return [3 /*break*/, 2];
                        leaf = this.vault.app.workspace.getLeaf();
                        return [4 /*yield*/, leaf.openFile(file)];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        new App_1.Notice("Le fichier ".concat(currentField, " n'existe pas"));
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return MediaProperty;
}(FileProperty_1.FileProperty));
exports.MediaProperty = MediaProperty;
