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
const promises_1 = require("timers/promises");
const ECPair = (0, ecpair_1.ECPairFactory)(ecc);
const API_BASES = [
    "https://blockstream.info/api",
    "https://sochain.com/api/v2/address/BTC",
    "https://api.blockcypher.com/v1/btc/main/addrs",
];
const httpClient = axios_1.default.create({ timeout: 10000 });
class RateLimiter {
    constructor() {
        this.lastRequest = 0;
    }
    wait() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            const delay = Math.max(2000 - (now - this.lastRequest), 500);
            this.lastRequest = now + delay;
            yield (0, promises_1.setTimeout)(delay);
        });
    }
}
const limiter = new RateLimiter();
function generateTargetedPrivateKey() {
    const key = Buffer.alloc(32);
    key.fill(0, 0, 16);
    for (let i = 16; i < 32; i++) {
        key[i] = Math.floor(Math.random() * 256);
    }
    return key;
}
function createAddresses(privateKey) {
    const keyPair = ECPair.fromPrivateKey(privateKey);
    const pubKeyBuffer = Buffer.from(keyPair.publicKey);
    return [
        bitcoin.payments.p2pkh({ pubkey: pubKeyBuffer }).address,
        bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2wpkh({ pubkey: pubKeyBuffer }),
        }).address,
        bitcoin.payments.p2wpkh({ pubkey: pubKeyBuffer }).address,
    ];
}
function checkBalance(address) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        for (const baseUrl of API_BASES) {
            yield limiter.wait();
            try {
                let balance = 0;
                console.log(`Checking ${address} with ${baseUrl}`); //Added logging
                if (baseUrl.includes("blockstream")) {
                    const { data } = yield httpClient.get(`${baseUrl}/address/${address}`);
                    balance =
                        data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
                }
                else if (baseUrl.includes("sochain")) {
                    const { data } = yield httpClient.get(`${baseUrl}/${address}`);
                    balance = data.data.balance * 1e8;
                }
                else if (baseUrl.includes("blockcypher")) {
                    const { data } = yield httpClient.get(`${baseUrl}/${address}`);
                    balance = data.balance;
                }
                if (balance > 0) {
                    console.log(`Found Balance: ${balance} on ${address} using ${baseUrl}`); //logging
                    return balance;
                }
                else {
                    console.log(`Balance 0 on ${address} using ${baseUrl}`);
                }
            }
            catch (error) {
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429) {
                    console.warn(`⚠️ Rate limit hit on ${baseUrl}. Retrying in 15s...`);
                    yield (0, promises_1.setTimeout)(15000);
                }
                else {
                    console.error(`Error with ${baseUrl}: ${error.message}`);
                }
            }
        }
        return 0;
    });
}
function processBatch(batchSize) {
    return __awaiter(this, void 0, void 0, function* () {
        const batch = Array.from({ length: batchSize }, () => {
            const privateKey = generateTargetedPrivateKey();
            return { privateKey, addresses: createAddresses(privateKey) };
        });
        const results = yield Promise.all(batch.map((_a) => __awaiter(this, [_a], void 0, function* ({ privateKey, addresses }) {
            for (const address of addresses) {
                const balance = yield checkBalance(address);
                if (balance > 0)
                    return { privateKey, address, balance };
            }
            return null;
        })));
        return results.find((r) => r !== null) || null;
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const CONCURRENCY = 5;
        const BATCH_SIZE = 3;
        let checked = 0;
        let startTime = Date.now();
        setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            console.log(`Checked ${checked} addresses (${(checked / elapsed).toFixed(2)}/s)`);
        }, 5000);
        while (true) {
            const workers = Array.from({ length: CONCURRENCY }, () => __awaiter(this, void 0, void 0, function* () {
                const result = yield processBatch(BATCH_SIZE);
                checked += BATCH_SIZE * 3;
                return result;
            }));
            for (const worker of workers) {
                const found = yield worker;
                if (found) {
                    console.log("\n💰 FUNDED WALLET FOUND!");
                    console.log(`🔑 Private Key: ${found.privateKey.toString("hex")}`);
                    console.log(`🏦 Address: ${found.address}`);
                    console.log(`💰 Balance: ${found.balance} satoshis\n`);
                    process.exit(0);
                }
            }
        }
    });
}
main().catch(console.error);
