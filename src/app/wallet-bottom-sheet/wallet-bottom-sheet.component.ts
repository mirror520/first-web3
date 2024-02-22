import { Component } from '@angular/core';

import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BaseWalletAdapter, WalletConnectionError } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

@Component({
  selector: 'app-wallet-bottom-sheet',
  standalone: true,
  imports: [
    MatListModule,
  ],
  templateUrl: './wallet-bottom-sheet.component.html',
  styleUrl: './wallet-bottom-sheet.component.sass'
})
export class WalletBottomSheetComponent {
  wallets: BaseWalletAdapter[] = [
    new PhantomWalletAdapter, 
    new SolflareWalletAdapter,
  ];

  constructor(
    private bottomSheetRef: MatBottomSheetRef<WalletBottomSheetComponent>,
    private snackBar: MatSnackBar,
  ) {}

  connectWallet(wallet: BaseWalletAdapter) {
    wallet.connect()
          .then(() => this.bottomSheetRef.dismiss(wallet))
          .catch((err: WalletConnectionError) => 
            this.snackBar.open(err.error, 'RETRY')
          )
  }
}
