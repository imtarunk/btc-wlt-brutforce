import * as bitcoin from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";
import * as ecc from "tiny-secp256k1";
import axios from "axios";

const ECPair = ECPairFactory(ecc);

// Generate a weak private key and return as Buffer
function generateWeakPrivateKey(): Buffer {
  const weakKey = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    weakKey[i] = Math.floor(Math.random() * 256);
  }
  return weakKey;
}

function createAddressFromPrivateKey(privateKey: Buffer): string {
  const keyPair = ECPair.fromPrivateKey(privateKey);
  const pubKeyBuffer = Buffer.from(keyPair.publicKey);
  const { address } = bitcoin.payments.p2pkh({ pubkey: pubKeyBuffer });
  if (!address) {
    throw new Error("Could not generate address.");
  }
  return address;
}

// Function to check if the wallet has funds
async function checkWalletBalance(address: string): Promise<number> {
  try {
    const response = await axios.get(
      `https://blockchain.info/q/getreceivedbyaddress/${address}`
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error(
        `Error checking balance for ${address}: ${error.response.status} ${error.response.data}`
      );
    } else if (error.request) {
      console.error(
        `Error checking balance for ${address}: No response received.`
      );
    } else {
      console.error(`Error checking balance for ${address}:`, error.message);
    }
    return 0; // Return 0 in case of error
  }
}

// Main function to generate keys and check balance
async function main() {
  while (true) {
    try {
      const weakPrivateKey = generateWeakPrivateKey();
      const address = createAddressFromPrivateKey(weakPrivateKey);
      const balance = await checkWalletBalance(address);

      console.log(`Checked Address: ${address}, Balance: ${balance} satoshis`);

      if (balance > 0) {
        console.log("\n🚀 Wallet with Funds Found!");
        console.log(`🔑 Private Key (Hex): ${weakPrivateKey.toString("hex")}`);
        console.log(`🏦 Address: ${address}`);
        console.log(`💰 Balance: ${balance} satoshis\n`);
        break; // Stop execution
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }
}

// Execute the main function
main().catch(console.error);
