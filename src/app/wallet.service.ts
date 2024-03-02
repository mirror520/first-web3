import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';

import { Connection, PublicKey } from '@solana/web3.js';
import { BaseWalletAdapter } from '@solana/wallet-adapter-base';

import { Transaction } from './model/transaction';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private _currentWallet: BaseWalletAdapter | undefined;
  private _walletChangeSubject = new BehaviorSubject<PublicKey | null>(null);

  walletChange = this._walletChangeSubject.asObservable();

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

  public refreshWallet(pubkey: PublicKey) {
    this._walletChangeSubject.next(pubkey);
  }

  public get currentWallet(): BaseWalletAdapter | undefined {
    return this._currentWallet;
  }

  public set currentWallet(value: BaseWalletAdapter | undefined) {
    const wallet = value;
    if (wallet == undefined) return;

    const pubkey = wallet.publicKey
    if (pubkey == null) return;

    if (this._currentWallet != undefined) {
      this._currentWallet.removeListener('connect');
      this._currentWallet = undefined;
    }

    this._currentWallet = wallet;

    wallet.addListener('connect', 
      (pubkey) => this.refreshWallet(pubkey))

    this.refreshWallet(pubkey);
  }
}
