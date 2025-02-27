"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bitcoin = __importStar(require("bitcoinjs-lib"));
const ecpair_1 = require("ecpair");
const ecc = __importStar(require("tiny-secp256k1"));
const axios_1 = __importDefault(require("axios"));
const ECPair = (0, ecpair_1.ECPairFactory)(ecc);
// Generate a weak private key and return as Buffer
function generateWeakPrivateKey() {
    const weakKey = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
        weakKey[i] = Math.floor(Math.random() * 256);
    }
    return weakKey;
}
function createAddressFromPrivateKey(privateKey) {
    const keyPair = ECPair.fromPrivateKey(privateKey);
    const pubKeyBuffer = Buffer.from(keyPair.publicKey);
    const { address } = bitcoin.payments.p2pkh({ pubkey: pubKeyBuffer });
    if (!address) {
        throw new Error("Could not generate address.");
    }
    return address;
}
// Function to check if the wallet has funds
function checkWalletBalance(address) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`https://blockchain.info/q/getreceivedbyaddress/${address}`);
            return response.data;
        }
        catch (error) {
            if (error.response) {
                console.error(`Error checking balance for ${address}: ${error.response.status} ${error.response.data}`);
            }
            else if (error.request) {
                console.error(`Error checking balance for ${address}: No response received.`);
            }
            else {
                console.error(`Error checking balance for ${address}:`, error.message);
            }
            return 0; // Return 0 in case of error
        }
    });
}
// Main function to generate keys and check balance
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            try {
                const weakPrivateKey = generateWeakPrivateKey();
                const address = createAddressFromPrivateKey(weakPrivateKey);
                const balance = yield checkWalletBalance(address);
                console.log(`Checked Address: ${address}, Balance: ${balance} satoshis`);
                if (balance > 0) {
                    console.log("\n🚀 Wallet with Funds Found!");
                    console.log(`🔑 Private Key (Hex): ${weakPrivateKey.toString("hex")}`);
                    console.log(`🏦 Address: ${address}`);
                    console.log(`💰 Balance: ${balance} satoshis\n`);
                    break; // Stop execution
                }
            }
            catch (error) {
                console.error("An error occurred:", error);
            }
        }
    });
}
// Execute the main function
main().catch(console.error);
