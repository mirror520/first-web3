import { SlicePipe } from '@angular/common';
import { Component } from '@angular/core';
import { concatAll, map } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { PublicKey } from '@solana/web3.js';
import { RawAccount } from '@solana/spl-token';

import { SolanaService } from '../solana.service';
import { WalletService } from '../wallet.service';
import { Account } from '../codec';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    SlicePipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.sass'
})
export class TransferComponent {
  displayedColumns: string[] = ['mint', 'amount'];
  tokenAccounts: Account<RawAccount>[] = new Array();

  constructor(
    private snackBar: MatSnackBar,
    private solService: SolanaService,
    private walletService: WalletService,
  ) {
  }

  refreshTokens() {
    const wallet = this.walletService.currentWallet;
    if (wallet == undefined) {
      this.snackBar.open('Please connect your wallet', 'OK');
      return;
    }

    const pubkey = wallet.publicKey;
    if (pubkey == null) {
      return
    }

    this.solService.getTokenAccountsByOwner(pubkey).subscribe({
      next: (accounts) => {
        this.tokenAccounts = accounts;

        // accounts.forEach(
        //   (account) => {
        //     const data = account.data;

        //     this.solService.getTokenInfo(data.mint).subscribe({
        //       next: (mint) => console.log(`
        //         mint: ${data.mint.toBase58()} (${mint.decimals}), 
        //         amount: ${Number(data.amount) / Math.pow(10, mint.decimals)}, 
        //         owner: ${data.owner.toBase58()}(${account.pubkey})
        //       `),
        //       error: (err) => console.error(err),
        //       complete: () => console.log('complete'),
        //     })
        //   }
        // );
      },
      error: (err) => console.error(err),
      complete: () => console.log('complete'),
    });
  }

  transfer() {
    const wallet = this.walletService.currentWallet;
    if (wallet == undefined) {
      return
    }

    const pubkey = wallet.publicKey;
    if (pubkey == null) {
      return
    }

    const source = new PublicKey('EnvtkwgjtXeRiH5NqhY8WqqUkCNnQd3LA1M4PNLe2BHp');
    const destination = new PublicKey('8MWWqzahEqLM4eTWzSnmFzMnDFL8eDz6kr5Gptx7VBVt');

    this.solService.transfer(
      source, 
      destination, 
      36000000 * 1_000_000_000, 
      pubkey,
    ).pipe(
      map((trx) => this.walletService.sendTransaction(trx, this.solService.connection)),
      concatAll(),
    ).subscribe({
      next: (signature) => console.log(signature),
      error: (err) => console.error(err),
      complete: () => console.log('complete')
    });
  }
}
