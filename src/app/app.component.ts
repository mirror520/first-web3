import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Observable, concatAll, map } from 'rxjs';

import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';

import { Connection } from '@solana/web3.js';
import { BaseWalletAdapter, WalletAdapterNetwork } from '@solana/wallet-adapter-base';

import { SolanaService } from './solana.service';
import { WalletService } from './wallet.service';
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
    MatTooltipModule,
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

  getAccount: Observable<string>;
  getBalance: Observable<number>;

  private _selectedNetwork = WalletAdapterNetwork.Mainnet;

  @ViewChild(MatDrawer) drawer?: MatDrawer;

  constructor(
    private router: Router,
    private bottomSheet: MatBottomSheet,
    private snackBar: MatSnackBar,
    private solService: SolanaService,
    private walletService: WalletService,
  ) {
    // TODO: local storage
    this.selectedNetwork = WalletAdapterNetwork.Devnet;

    this.solService.networkChange.asObservable().subscribe({
      next: () => {
        if (this.walletService.currentWallet == undefined) {
          return;
        }

        this.walletService.walletChange.emit();
      },
      error: (err) => console.error(err),
      complete: () => console.log('complete'),
    });

    this.walletService.walletChange.asObservable().subscribe({
      next: (pubkey) => {
        console.log(`wallet connected, pubkey: ${pubkey}`);

        this.snackBar.open('WALLET CONNECTED', 'OK', {
          duration: 3000,
        });
      },
      error: (err) => console.error(err),
      complete: () => console.log('complete'),
    });

    this.getAccount = this.walletService.walletChange.asObservable().pipe(
      map((pubkey) => this.solService.getAccount(pubkey)),
      concatAll(),
    );

    this.getBalance = this.walletService.walletChange.asObservable().pipe(
      map((pubkey) => this.solService.getBalance(pubkey)),
      concatAll(),
    );
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

  switchRouter(url: string) {
    this.router.navigateByUrl(url);

    if (this.width < 1024) {
      this.drawer?.close();
    }
  }

  get selectedNetwork(): WalletAdapterNetwork {
    return this._selectedNetwork;
  }

  set selectedNetwork(value: WalletAdapterNetwork) {
    this._selectedNetwork = value;

    this.solService.connect(value).subscribe({
      next: (version) => console.log(`network: ${value}, version: ${JSON.stringify(version)}`),
      error: (err) => console.error(err),
      complete: () => console.log('complete'),
    });
  }

  public get currentWallet(): BaseWalletAdapter | undefined {
    return this.walletService.currentWallet;
  }

  public set currentWallet(value: BaseWalletAdapter | undefined) {
    if (value == undefined) {
      return
    }

    this.walletService.currentWallet = value;

    if (value.publicKey != null) {
      this.walletService.walletChange.emit(value.publicKey)
    }
  }

  public get connection(): Connection {
    return this.solService.connection;
  }
}
