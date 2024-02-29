import { EventEmitter, Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';

import { Connection, PublicKey } from '@solana/web3.js';
import { BaseWalletAdapter } from '@solana/wallet-adapter-base';

import { Transaction } from './codec';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private _currentWallet: BaseWalletAdapter | undefined;

  walletChange = new EventEmitter<PublicKey>();

  public sendTransaction(trx: Transaction, connection: Connection): Observable<string | undefined> {
    if (this.currentWallet == undefined) {
      return of(undefined)
    }

    return from(this.currentWallet.sendTransaction(
      trx.transaction, 
      connection, 
      trx.options,
    ));
  }

  public get currentWallet(): BaseWalletAdapter | undefined {
    return this._currentWallet;
  }

  public set currentWallet(value: BaseWalletAdapter | undefined) {
    if (value == undefined) {
      return
    }

    if (this._currentWallet != undefined) {
      this._currentWallet.removeListener('connect');
      this._currentWallet = undefined;
    }

    this._currentWallet = value;

    value.addListener('connect', (pubkey) => this.walletChange.emit(pubkey))
  }
}
