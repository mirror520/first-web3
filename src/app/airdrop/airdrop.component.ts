import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import { WalletService } from '../wallet.service';
import { SolanaService } from '../solana.service';
import { BaseWalletAdapter } from '@solana/wallet-adapter-base';

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
  max = 2 * LAMPORTS_PER_SOL;
  step = 0.01 * LAMPORTS_PER_SOL;
  lamports = 2 * LAMPORTS_PER_SOL;

  errorMsg: string | undefined;
  loading: boolean = false;

  constructor(
    private walletService: WalletService,
    private solService: SolanaService,
  ) {
  }

  formatLabel(lamports: number): string {
    return `${lamports / LAMPORTS_PER_SOL}`;
  }

  requestAirdrop(lamports: number) {
    if ((this.currentWallet == undefined) || 
        (this.currentWallet.publicKey == null)) {
      return
    }

    this.loading = true;

    this.solService.requestAirdrop(this.currentWallet.publicKey, lamports).subscribe({
      next: (result) => console.log(result),
      error: (err) => this.errorMsg = err,
      complete: () => this.loading = false,
    });
  }

  public get currentWallet(): BaseWalletAdapter | undefined {
    return this.walletService.currentWallet;
  }
}
