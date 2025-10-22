"use strict";
/**
 * Test simple pour valider le système de configuration sans Jest
 * Exécute quelques tests de base pour s'assurer que tout fonctionne
 */
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
var ConfigLoader_1 = require("./Utils/Config/ConfigLoader");
var DynamicClassFactory_1 = require("./Utils/Config/DynamicClassFactory");
var fs = require("fs");
function runBasicTests() {
    return __awaiter(this, void 0, void 0, function () {
        var configFiles, _i, configFiles_1, configName, configPath, configLoader, personneConfig_1, error_1, property, factory, availableClasses, firstClass, dynamicClass, error_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🧪 Démarrage des tests de validation du système de configuration...\n');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 12, , 13]);
                    // Test 1: Vérifier que les fichiers de configuration existent
                    console.log('📁 Test 1: Vérification des fichiers de configuration YAML...');
                    configFiles = [
                        'Personne', 'Institution', 'Lieu', 'Evenement',
                        'Action', 'Note', 'Partenariat', 'Animateur'
                    ];
                    for (_i = 0, configFiles_1 = configFiles; _i < configFiles_1.length; _i++) {
                        configName = configFiles_1[_i];
                        configPath = "./config/".concat(configName, ".yaml");
                        if (fs.existsSync(configPath)) {
                            console.log("\u2705 ".concat(configName, ".yaml trouv\u00E9"));
                        }
                        else {
                            console.log("\u274C ".concat(configName, ".yaml manquant"));
                        }
                    }
                    // Test 2: Charger une configuration via ConfigLoader
                    console.log('\n📝 Test 2: Chargement d\'une configuration...');
                    configLoader = new ConfigLoader_1.ConfigLoader('./config');
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, configLoader.loadClassConfig('Personne')];
                case 3:
                    personneConfig_1 = _a.sent();
                    console.log("\u2705 Configuration Personne charg\u00E9e:");
                    console.log("   - Nom de classe: ".concat(personneConfig_1.className));
                    console.log("   - Ic\u00F4ne: ".concat(personneConfig_1.classIcon));
                    console.log("   - Propri\u00E9t\u00E9s: ".concat(Object.keys(personneConfig_1.properties).length, " trouv\u00E9es"));
                    // Afficher les propriétés
                    Object.keys(personneConfig_1.properties).forEach(function (propName) {
                        var prop = personneConfig_1.properties[propName];
                        console.log("     \u2022 ".concat(propName, " (").concat(prop.type, ")"));
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.log("\u274C Erreur lors du chargement: ".concat(error_1));
                    return [3 /*break*/, 5];
                case 5:
                    // Test 3: Créer une propriété
                    console.log('\n🔧 Test 3: Création d\'une propriété...');
                    try {
                        property = configLoader.createProperty({
                            type: 'Property',
                            name: 'testProp'
                        });
                        console.log("\u2705 Propri\u00E9t\u00E9 cr\u00E9\u00E9e: ".concat(property.constructor.name));
                    }
                    catch (error) {
                        console.log("\u274C Erreur cr\u00E9ation propri\u00E9t\u00E9: ".concat(error));
                    }
                    // Test 4: DynamicClassFactory
                    console.log('\n🏭 Test 4: Factory de classes dynamiques...');
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 10, , 11]);
                    factory = DynamicClassFactory_1.DynamicClassFactory.getInstance('./config');
                    return [4 /*yield*/, factory.getAvailableClasses()];
                case 7:
                    availableClasses = _a.sent();
                    console.log("\u2705 Classes disponibles: ".concat(availableClasses.join(', ')));
                    if (!(availableClasses.length > 0)) return [3 /*break*/, 9];
                    firstClass = availableClasses[0];
                    return [4 /*yield*/, factory.getClass(firstClass)];
                case 8:
                    dynamicClass = _a.sent();
                    console.log("\u2705 Classe dynamique ".concat(firstClass, " cr\u00E9\u00E9e"));
                    _a.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    error_2 = _a.sent();
                    console.log("\u274C Erreur Factory: ".concat(error_2));
                    return [3 /*break*/, 11];
                case 11:
                    console.log('\n🎉 Tests terminés !');
                    return [3 /*break*/, 13];
                case 12:
                    error_3 = _a.sent();
                    console.error('💥 Erreur générale:', error_3);
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
// Exécuter les tests
runBasicTests()["catch"](console.error);
