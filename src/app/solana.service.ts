import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, from, map, of } from 'rxjs';

import { 
  Connection, 
  PublicKey, 
  RpcResponseAndContext,
  SignatureResult,
  TransactionConfirmationStrategy, 
  TransactionInstruction, 
  TransactionMessage, 
  TransactionSignature, 
  Version, 
  VersionedTransaction,
  clusterApiUrl, 
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { 
  AccountLayout, RawAccount, 
  MintLayout, RawMint, 
  TOKEN_PROGRAM_ID, 
} from '@solana/spl-token';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { getFavoriteDomain } from '@bonfida/spl-name-service';

import { Account, Transaction } from './codec';
import { environment as env } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SolanaService {
  private _network = WalletAdapterNetwork.Devnet;
  private _connection: Connection;
  private _connectionChangeSubject = new BehaviorSubject<Connection | null>(null);

  connectionChange = this._connectionChangeSubject.asObservable();

  constructor() {
    let endpoint = clusterApiUrl(this.network);
    this._connection = new Connection(endpoint, 'confirmed');
  }

  connect(network: WalletAdapterNetwork): Observable<Version> {
    let endpoint = clusterApiUrl(network);
    if (network == WalletAdapterNetwork.Mainnet) {
      endpoint = env.SOLANA_MAINNET_ENDPOINT;
    }

    this.network = network;
    this.connection = new Connection(endpoint, 'confirmed');

    return this.getVersion();
  }

  getVersion(): Observable<Version> {
    return from(this.connection.getVersion());
  }

  getAccount(pubkey: PublicKey | null): Observable<string | undefined> {
    if (pubkey == null) return of(undefined);

    return from(
      getFavoriteDomain(this.connection, pubkey), 
    ).pipe(
      map(({domain, reverse, stale}) => reverse + '.sol'),
      catchError((_) => of(pubkey.toBase58().slice(0, 10) + '...')),
    );
  }

  getBalance(pubkey: PublicKey | null): Observable<number | undefined> {
    if (pubkey == null) return of(undefined);

    return from(
      this.connection.getBalance(pubkey),
    ).pipe(
      map((balance) => balance / LAMPORTS_PER_SOL),
    );
  }

  requestAirdrop(to: PublicKey, lamports: number): Observable<string> {
    return from(this.connection.requestAirdrop(to, lamports));
  }

  getTokenInfo(token: PublicKey): Observable<RawMint> {
    return from(
      this.connection.getAccountInfo(token)
    ).pipe(
      map((account) => {
        if (account == null) {
          throw new Error(`account not found`);
        }

        return MintLayout.decode(account.data);
      })
    )
  }

  getTokenAccountsByOwner(owner: PublicKey): Observable<Account<RawAccount>[]> {
    return from(
      this.connection.getTokenAccountsByOwner(owner, { 
        programId: TOKEN_PROGRAM_ID 
      })
    ).pipe(
      map((accounts) => accounts.value.flatMap(
        (raw) => new Account(
          raw.pubkey, 
          AccountLayout.decode(raw.account.data),
        )
      ))
    );
  }

  confirmTransaction(transaction: TransactionConfirmationStrategy | TransactionSignature): Observable<{}> { 
    let observable: Observable<RpcResponseAndContext<SignatureResult>>;

    if (typeof transaction == 'string') {
      const signature: TransactionSignature = transaction
      observable = from(this.connection.confirmTransaction(signature));
    } else {
      const strategy = transaction;
      observable = from(this.connection.confirmTransaction(strategy));
    }

    return observable.pipe(
      map((result) => {
        const err = result.value.err
        if ((err != null) && (typeof err == 'string')) {
          throw new Error(err)
        }

        return {}
      })
    )
  }

  transfer(source: PublicKey, destination: PublicKey, amount: number, owner: PublicKey): Observable<Transaction> {
    const keys = [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ];

    // 3 => Self::Transfer { amount }
    const data = Buffer.alloc(9);
    data.writeUInt8(3);                      // cmd (1 byte)
    data.writeBigInt64LE(BigInt(amount), 1); // amount (8 bytes)

    const txInstruction = new TransactionInstruction({ keys, programId: TOKEN_PROGRAM_ID , data });

    return from(
      this.connection.getLatestBlockhashAndContext()
    ).pipe(
      map((result) => {
        const messageV0 = new TransactionMessage({
          payerKey: owner,
          recentBlockhash: result.value.blockhash,
          instructions: [ txInstruction ],
        }).compileToV0Message();

        const trx = new VersionedTransaction(messageV0);

        return new Transaction(trx, { minContextSlot: result.context.slot });
      }),
    )
  }

  public get network(): WalletAdapterNetwork {
    return this._network;
  }

  public set network(value: WalletAdapterNetwork) {
    this._network = value;
  }

  public get connection(): Connection {
    return this._connection;
  }

  public set connection(value: Connection) {
    this._connection = value;

    this._connectionChangeSubject.next(value);
  }
}
