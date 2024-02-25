import { Injectable } from '@angular/core';
import { Observable, catchError, from, map, of } from 'rxjs';

import { 
  Connection, PublicKey, Version, 
  clusterApiUrl, 
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { getFavoriteDomain } from '@bonfida/spl-name-service';

import { environment as env } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SolanaService {
  private _connection: Connection;

  constructor() {
    let endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
    this._connection = new Connection(endpoint, 'confirmed');
  }

  connect(network: WalletAdapterNetwork): Observable<Version> {
    let endpoint = clusterApiUrl(network);
    if (network == WalletAdapterNetwork.Mainnet) {
      endpoint = env.SOLANA_MAINNET_ENDPOINT;
    }

    this.connection = new Connection(endpoint, 'confirmed');

    return this.getVersion();
  }

  getVersion(): Observable<Version> {
    return from(this.connection.getVersion());
  }

  getAccount(pubkey: PublicKey): Observable<string> {
    return from(
      getFavoriteDomain(this.connection, pubkey), 
    ).pipe(
      map(({domain, reverse, stale}) => reverse + '.sol'),
      catchError((_) => of(pubkey.toBase58().slice(0, 10) + '...')),
    );
  }

  getBalance(pubkey: PublicKey): Observable<number> {
    return from(
      this.connection.getBalance(pubkey),
    ).pipe(map((balance) => balance / LAMPORTS_PER_SOL));
  }

  requestAirdrop(pubkey: PublicKey, lamports: number): Observable<string> {
    return from(
      this.connection.requestAirdrop(pubkey, lamports), 
    ).pipe(
      map((signature) => 
        from(this.connection.confirmTransaction(signature))
      ),
      map((result) => JSON.stringify(result)),
    );
  }

  public get connection(): Connection {
    return this._connection;
  }

  public set connection(value: Connection) {
    this._connection = value;
  }
}
