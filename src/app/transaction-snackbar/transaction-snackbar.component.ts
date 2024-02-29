import { SlicePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

import { SolanaService } from '../solana.service';

@Component({
  selector: 'app-transaction-snackbar',
  standalone: true,
  imports: [
    SlicePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './transaction-snackbar.component.html',
  styleUrl: './transaction-snackbar.component.sass'
})
export class TransactionSnackbarComponent implements OnInit {
  isConfirmed = false;
  err: Error | undefined;

  constructor(
    @Inject(MAT_SNACK_BAR_DATA)
    public data: { 
      signature: string,
      network: WalletAdapterNetwork,
      action: () => void,
    },

    public snackBarRef: MatSnackBarRef<TransactionSnackbarComponent>,

    private solService: SolanaService,
  ) {}

  ngOnInit(): void {
    this.solService.confirmTransaction(this.data.signature).subscribe({
      next: ({}) => this.isConfirmed = true,
      error: (err) => this.err = err,
      complete: () => this.data.action(),
    })
  }
}
