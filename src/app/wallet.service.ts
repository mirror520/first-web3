import { Injectable } from '@angular/core';
import { BaseWalletAdapter } from '@solana/wallet-adapter-base';
import { PublicKey } from '@solana/web3.js';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private _currentWallet: BaseWalletAdapter | undefined;

  constructor() {
  }

  public addConnectHandler(handler: (pubkey: PublicKey) => void) {
    this.currentWallet?.addListener('connect', handler);
  }

  public get currentWallet(): BaseWalletAdapter | undefined {
    return this._currentWallet;
  }

  public set currentWallet(value: BaseWalletAdapter | undefined) {
    this._currentWallet = value;
  }
}
