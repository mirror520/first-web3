import { Component, HostListener, OnInit } from '@angular/core';
import { AsyncPipe, CurrencyPipe, SlicePipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Observable, from, map } from 'rxjs';

import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { Connection, clusterApiUrl } from '@solana/web3.js';
import { BaseWalletAdapter, WalletAdapterNetwork } from '@solana/wallet-adapter-base';

import { WalletBottomSheetComponent } from './wallet-bottom-sheet/wallet-bottom-sheet.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    SlicePipe,
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

  connection: Connection | undefined;

  getBalance: Observable<number> | undefined;

  private _selectedNetwork = WalletAdapterNetwork.Mainnet;
  private _currentWallet: BaseWalletAdapter | undefined;

  constructor(
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
    ref.afterDismissed().subscribe((wallet) => this.currentWallet = wallet);
  }

  disconnect() {
    if (this.currentWallet != undefined) {
      this.currentWallet.disconnect();
      this.currentWallet = undefined;
    }
  }

  connectNetwork() {
    let endpoint = clusterApiUrl(this.selectedNetwork);
    if (this.selectedNetwork == WalletAdapterNetwork.Mainnet) {
      // TODO: move to environment
      endpoint = "https://solana-mainnet.g.alchemy.com/v2/sxlC7jbdleGW3qk5eSCrxvnnPCEXQKxF";
    }

    const connection = new Connection(endpoint, 'confirmed');
    connection.getVersion()
              .then(version => {
                console.log(`Network: ${this.selectedNetwork}, Version: ${JSON.stringify(version)}`);

                this.connection = connection;
                this.refreshAccount();
              })
              .catch(err => console.error(err));
  }

  refreshAccount() {
    if ((this.connection == undefined) || 
        (this.currentWallet == undefined) || 
        (this.currentWallet.publicKey == null)) {
      return;
    }

    this.getBalance = from(this.connection.getBalance(this.currentWallet?.publicKey))
                     .pipe(map((balance) => balance / 1_000_000_000));
  }

  get selectedNetwork(): WalletAdapterNetwork {
    return this._selectedNetwork;
  }

  set selectedNetwork(value: WalletAdapterNetwork) {
    this._selectedNetwork = value;

    this.connection = undefined;
    this.connectNetwork();
  }

  get currentWallet(): BaseWalletAdapter | undefined {
    return this._currentWallet;
  }

  set currentWallet(value: BaseWalletAdapter | undefined) {
    if ((value == undefined) || (value.publicKey == null)) {
      return;
    }

    value.addListener('connect', (pubkey) => this.refreshAccount());

    this._currentWallet = value;

    this.refreshAccount();
  }
}
