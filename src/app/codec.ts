import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { SendTransactionOptions } from '@solana/wallet-adapter-base';

export class Transaction {
  transaction: VersionedTransaction;
  options: SendTransactionOptions;

  constructor(vtrx: VersionedTransaction, opts: SendTransactionOptions) {
    this.transaction = vtrx;
    this.options = opts;
  }
}

export class Account<T> {
  pubkey: PublicKey;
  data: T;

  constructor(pubkey: PublicKey, data: T) {
    this.pubkey = pubkey;
    this.data = data;
  }
}
