import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BaseWalletAdapter } from '@solana/wallet-adapter-base';

import { SolanaService } from '../solana.service';
import { WalletService } from '../wallet.service';
import { TransactionSnackbarComponent } from '../transaction-snackbar/transaction-snackbar.component';

@Component({
  selector: 'app-airdrop',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatSliderModule,
    MatProgressBarModule,
  ],
  templateUrl: './airdrop.component.html',
  styleUrl: './airdrop.component.sass'
})
export class AirdropComponent {
  min = 0;
  max = 10 * LAMPORTS_PER_SOL;
  step = 0.01 * LAMPORTS_PER_SOL;
  lamports = 2 * LAMPORTS_PER_SOL;

  errorMsg: string | undefined;
  loading: boolean = false;

  constructor(
    private snackBar: MatSnackBar,
    private solService: SolanaService,
    private walletService: WalletService,
  ) {
  }

  formatLabel(lamports: number): string {
    return `${lamports / LAMPORTS_PER_SOL}`;
  }

  requestAirdrop(lamports: number) {
    const wallet = this.currentWallet;
    if (wallet == undefined) {
      return
    }

    const pubkey = wallet.publicKey;
    if (pubkey == null) {
      return
    }

    this.loading = true;

    this.solService.requestAirdrop(pubkey, lamports).subscribe({
      next: (signature) => {
        this.snackBar.openFromComponent(TransactionSnackbarComponent, {
          data: {
            signature: signature,
            network: this.solService.network,
            action: () => {
              this.walletService.walletChange.emit(pubkey)
            },
          }
        });
      },
      error: (err) => this.errorMsg = err,
      complete: () => this.loading = false,
    });
  }

  public get currentWallet(): BaseWalletAdapter | undefined {
    return this.walletService.currentWallet;
  }
}
