import { SendTransactionOptions } from "@solana/wallet-adapter-base";
import { VersionedTransaction } from "@solana/web3.js";

export class Transaction {
  transaction: VersionedTransaction;
  options: SendTransactionOptions;

  constructor(vtrx: VersionedTransaction, opts: SendTransactionOptions) {
    this.transaction = vtrx;
    this.options = opts;
  }
}
