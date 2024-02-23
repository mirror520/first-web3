import { Injectable } from '@angular/core';
import { Observable, catchError, from, map, of } from 'rxjs';

import { Connection, PublicKey, Version, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { getFavoriteDomain } from '@bonfida/spl-name-service';

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
      // TODO: move to environment
      endpoint = "https://solana-mainnet.g.alchemy.com/v2/sxlC7jbdleGW3qk5eSCrxvnnPCEXQKxF";
    }

    this.connection = new Connection(endpoint, 'confirmed');

    return this.getVersion();
  }

  getVersion(): Observable<Version> {
    return from(this.connection.getVersion());
  }

  getAccount(pubkey: PublicKey): Observable<string> {
    return from(
      getFavoriteDomain(this.connection, pubkey)
    ).pipe(
      map(({domain, reverse, stale}) => reverse + '.sol'),
      catchError(err => of(pubkey.toBase58().slice(0, 10) + '...')),
    );
  }

  getBalance(pubkey: PublicKey): Observable<number> {
    return from(
      this.connection.getBalance(pubkey)
    ).pipe(map((balance) => balance / 1_000_000_000));
  }

  public get connection(): Connection {
    return this._connection;
  }

  public set connection(value: Connection) {
    this._connection = value;
  }
}
