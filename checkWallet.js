"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
var bitcoin = require("bitcoinjs-lib");
var ecpair_1 = require("ecpair");
var ecc = require("tiny-secp256k1");
var axios_1 = require("axios");
var ECPair = (0, ecpair_1.ECPairFactory)(ecc);
// Generate a weak private key and return as Buffer
function generateWeakPrivateKey() {
    var weakKey = Buffer.alloc(32);
    for (var i = 0; i < 32; i++) {
        weakKey[i] = Math.floor(Math.random() * 256);
    }
    console.log("Generated Weak Private Key: ".concat(weakKey.toString("hex")));
    return weakKey;
}
// Create a Bitcoin address from the private key
function createAddressFromPrivateKey(privateKey) {
    var keyPair = ECPair.fromPrivateKey(privateKey);
    //@ts-ignore
    var address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }).address;
    console.log("Generated Address: ".concat(address));
    return address;
}
// Function to check if the wallet has funds
function checkWalletBalance(address) {
    return __awaiter(this, void 0, void 0, function () {
        var response, balance, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get("https://blockchain.info/q/getreceivedbyaddress/".concat(address))];
                case 1:
                    response = _a.sent();
                    balance = response.data;
                    console.log("Balance for Address ".concat(address, ": ").concat(balance, " satoshis"));
                    if (balance > 0) {
                        console.log("Wallet ".concat(address, " has funds: ").concat(balance, " satoshis"));
                    }
                    else {
                        console.log("Wallet ".concat(address, " has no funds."));
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error checking balance for ".concat(address, ":"), error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Main function to generate keys and check balance
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var weakPrivateKey, address;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    weakPrivateKey = generateWeakPrivateKey();
                    address = createAddressFromPrivateKey(weakPrivateKey);
                    return [4 /*yield*/, checkWalletBalance(address)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Execute the main function and handle any errors
main().catch(console.error);
