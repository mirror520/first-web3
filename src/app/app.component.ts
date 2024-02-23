import { Component, HostListener, OnInit } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';

import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { Connection } from '@solana/web3.js';
import { BaseWalletAdapter, WalletAdapterNetwork } from '@solana/wallet-adapter-base';

import { SolanaService } from './solana.service';
import { WalletBottomSheetComponent } from './wallet-bottom-sheet/wallet-bottom-sheet.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    RouterOutlet,
    MatBottomSheetModule,
    MatButtonModule,
    MatFormFieldModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent implements OnInit {
  title = 'Web3';
  width = document.documentElement.clientWidth;

  networks = Object.entries(WalletAdapterNetwork)
                   .map(([ key, value ]) => ({ key, value }));

  getAccount: Observable<string> | undefined;
  getBalance: Observable<number> | undefined;

  private _selectedNetwork = WalletAdapterNetwork.Mainnet;
  private _currentWallet: BaseWalletAdapter | undefined;

  constructor(
    private solService: SolanaService,
    private bottomSheet: MatBottomSheet,
  ) {
    // TODO: local storage
    this.selectedNetwork = WalletAdapterNetwork.Devnet;
  }

  ngOnInit(): void {
    this.width = window.innerWidth;
  }

  @HostListener('window:resize', ['$event'])
  windowsResizeHandler() {
    this.width = window.innerWidth;
  }

  openWalletBottomSheet() {
    this.disconnect();

    if (this.currentWallet != undefined) {
      this.currentWallet.disconnect();
      this.currentWallet = undefined;
    }

    let ref = this.bottomSheet.open(WalletBottomSheetComponent);
    ref.afterDismissed()
       .subscribe((wallet) => this.currentWallet = wallet);
  }

  disconnect() {
    if (this.currentWallet != undefined) {
      this.currentWallet.disconnect();
      this.currentWallet = undefined;
    }
  }

  refreshAccount() {
    if ((this.currentWallet == undefined) || 
        (this.currentWallet.publicKey == null)) {
      return;
    }

    this.getAccount = this.solService.getAccount(this.currentWallet.publicKey);
    this.getBalance = this.solService.getBalance(this.currentWallet.publicKey);
  }

  get selectedNetwork(): WalletAdapterNetwork {
    return this._selectedNetwork;
  }

  set selectedNetwork(value: WalletAdapterNetwork) {
    this._selectedNetwork = value;

    this.solService.connect(value).subscribe({
      next: (version) => console.log(`network: ${value}, version: ${JSON.stringify(version)}`),
      error: (err) => console.error(err),
      complete: () => this.refreshAccount()
    });;
  }

  public get currentWallet(): BaseWalletAdapter | undefined {
    return this._currentWallet;
  }

  public set currentWallet(value: BaseWalletAdapter | undefined) {
    if ((value == undefined) || (value.publicKey == null)) {
      return;
    }

    value.addListener('connect', (_) => this.refreshAccount());

    this._currentWallet = value;

    this.refreshAccount();
  }

  public get connection(): Connection {
    return this.solService.connection;
  }
}
