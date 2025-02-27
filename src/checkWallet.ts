import * as bitcoin from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";
import * as ecc from "tiny-secp256k1";
import axios from "axios";
import { setTimeout as sleep } from "timers/promises";

const ECPair = ECPairFactory(ecc);
const API_BASES = [
  "https://blockstream.info/api",
  "https://sochain.com/api/v2/address/BTC",
  "https://api.blockcypher.com/v1/btc/main/addrs",
];

const httpClient = axios.create({ timeout: 10000 });

class RateLimiter {
  private lastRequest = 0;

  async wait(): Promise<void> {
    const now = Date.now();
    const delay = Math.max(2000 - (now - this.lastRequest), 500);
    this.lastRequest = now + delay;
    await sleep(delay);
  }
}

const limiter = new RateLimiter();

function generateTargetedPrivateKey(): Buffer {
  const key = Buffer.alloc(32);
  key.fill(0, 0, 16);
  for (let i = 16; i < 32; i++) {
    key[i] = Math.floor(Math.random() * 256);
  }
  return key;
}

function createAddresses(privateKey: Buffer): string[] {
  const keyPair = ECPair.fromPrivateKey(privateKey);
  const pubKeyBuffer = Buffer.from(keyPair.publicKey);
  return [
    bitcoin.payments.p2pkh({ pubkey: pubKeyBuffer }).address!,
    bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({ pubkey: pubKeyBuffer }),
    }).address!,
    bitcoin.payments.p2wpkh({ pubkey: pubKeyBuffer }).address!,
  ];
}

async function checkBalance(address: string): Promise<number> {
  for (const baseUrl of API_BASES) {
    await limiter.wait();
    try {
      let balance = 0;
      console.log(`Checking ${address} with ${baseUrl}`); //Added logging

      if (baseUrl.includes("blockstream")) {
        const { data } = await httpClient.get(`${baseUrl}/address/${address}`);
        balance =
          data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      } else if (baseUrl.includes("sochain")) {
        const { data } = await httpClient.get(`${baseUrl}/${address}`);
        balance = data.data.balance * 1e8;
      } else if (baseUrl.includes("blockcypher")) {
        const { data } = await httpClient.get(`${baseUrl}/${address}`);
        balance = data.balance;
      }

      if (balance > 0) {
        console.log(`Found Balance: ${balance} on ${address} using ${baseUrl}`); //logging
        return balance;
      } else {
        console.log(`Balance 0 on ${address} using ${baseUrl}`);
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn(`⚠️ Rate limit hit on ${baseUrl}. Retrying in 15s...`);
        await sleep(15000);
      } else {
        console.error(`Error with ${baseUrl}: ${error.message}`);
      }
    }
  }
  return 0;
}

async function processBatch(batchSize: number) {
  const batch = Array.from({ length: batchSize }, () => {
    const privateKey = generateTargetedPrivateKey();
    return { privateKey, addresses: createAddresses(privateKey) };
  });

  const results = await Promise.all(
    batch.map(async ({ privateKey, addresses }) => {
      for (const address of addresses) {
        const balance = await checkBalance(address);
        if (balance > 0) return { privateKey, address, balance };
      }
      return null;
    })
  );

  return results.find((r) => r !== null) || null;
}

async function main() {
  const CONCURRENCY = 5;
  const BATCH_SIZE = 3;
  let checked = 0;
  let startTime = Date.now();

  setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    console.log(
      `Checked ${checked} addresses (${(checked / elapsed).toFixed(2)}/s)`
    );
  }, 5000);

  while (true) {
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      const result = await processBatch(BATCH_SIZE);
      checked += BATCH_SIZE * 3;
      return result;
    });

    for (const worker of workers) {
      const found = await worker;
      if (found) {
        console.log("\n💰 FUNDED WALLET FOUND!");
        console.log(`🔑 Private Key: ${found.privateKey.toString("hex")}`);
        console.log(`🏦 Address: ${found.address}`);
        console.log(`💰 Balance: ${found.balance} satoshis\n`);
        process.exit(0);
      }
    }
  }
}

main().catch(console.error);
