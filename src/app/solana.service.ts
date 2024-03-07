import { Injectable } from '@angular/core';
import { 
  BehaviorSubject, Observable, 
  asyncScheduler, catchError, forkJoin, from, map, mergeAll, of, reduce, scheduled 
} from 'rxjs';

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
  AccountLayout, Mint, 
  getMint, getTokenMetadata, 
  TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { TokenMetadata } from '@solana/spl-token-metadata';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { getFavoriteDomain } from '@bonfida/spl-name-service';

import { Account, AssociatedTokenAccount, ToATA, Token } from './model/account';
import { Transaction } from './model/transaction';
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

  getToken(mint: PublicKey, programId: PublicKey = TOKEN_PROGRAM_ID): Observable<Mint> {
    return from(getMint(this.connection, mint, undefined, programId));
  }

  getTokenMetadata(mint: PublicKey): Observable<TokenMetadata | null> {
    return from(getTokenMetadata(this.connection, mint));
  }

  getTokenAccountsByOwner(owner: PublicKey): Observable<AssociatedTokenAccount[]> {
    return scheduled([
      from(this.connection.getTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID })),
      from(this.connection.getTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID })),
    ], asyncScheduler).pipe(
      mergeAll(),
      map((accounts) => accounts.value.flatMap(
        (raw) => {
          const account = new Account(
            raw, 
            AccountLayout.decode(raw.account.data),
          );

          const ata = ToATA(account);

          let observable: Observable<Token>;
          if (!ata.isToken2022()) {
            observable = this.getToken(ata.mint).pipe(
              map((mint) => new Token(mint))
            );
          } else {
            observable = forkJoin({
              mint: this.getToken(ata.mint, TOKEN_2022_PROGRAM_ID),
              metadata: this.getTokenMetadata(ata.mint),
            }).pipe(
              map(({ mint, metadata }) => {
                const token = new Token(mint);
                token.metadata = metadata;

                return token;
              }) 
            );
          }

          observable.subscribe(
            (token) => ata.token = token 
          );
          
          return ata;
        }
      )),
      reduce((acc, value) => acc.concat(value)),
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

  transfer(source: PublicKey, destination: PublicKey, amount: number, owner: PublicKey, instructions: TransactionInstruction[]): Observable<Transaction> {
    return from(
      this.connection.getLatestBlockhashAndContext(),
    ).pipe(
      map((result) => {
        const keys = [
          { pubkey: source, isSigner: false, isWritable: true },
          { pubkey: destination, isSigner: false, isWritable: true },
          { pubkey: owner, isSigner: true, isWritable: false },
        ];

        // 3 => Self::Transfer { amount }
        const data = Buffer.alloc(9);
        data.writeUInt8(3);                      // cmd (1 byte)
        data.writeBigInt64LE(BigInt(amount), 1); // amount (8 bytes)

        instructions.push(new TransactionInstruction(
          { keys, programId: TOKEN_PROGRAM_ID , data }
        )) ;

        const messageV0 = new TransactionMessage({
          payerKey: owner,
          recentBlockhash: result.value.blockhash,
          instructions: instructions,
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
