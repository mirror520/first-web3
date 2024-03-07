import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { 
  AbstractControl, 
  FormBuilder,
  FormsModule, 
  FormGroup,
  ReactiveFormsModule, 
  Validators, 
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Observable, concatAll, map } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';

import { SolanaService } from '../solana.service';
import { WalletService } from '../wallet.service';
import { AssociatedTokenAccount } from '../model/account';
import { TransactionSnackbarComponent } from '../transaction-snackbar/transaction-snackbar.component';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    AsyncPipe, 
    CurrencyPipe,
    FormsModule, 
    ReactiveFormsModule, 
    MatButtonModule,
    MatCardModule,
    MatExpansionModule, 
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.sass'
})
export class TransferComponent {
  forms: FormGroup[] = new Array();

  tokenAccounts: Observable<AssociatedTokenAccount[]> | undefined;

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private solService: SolanaService,
    private walletService: WalletService,
  ) {}

  refreshTokens() {
    const wallet = this.walletService.currentWallet;
    if (wallet == undefined) {
      this.snackBar.open('Please connect your wallet', 'OK');
      return;
    }

    const pubkey = wallet.publicKey;
    if (pubkey == null) return;

    this.tokenAccounts = this.solService.getTokenAccountsByOwner(pubkey).pipe(
      map((accounts) => {
        this.forms = accounts.map((account) => this.formBuilder.group({
          toWallet: ['', [
            Validators.required,
            this.walletValidator,
          ]],
          amount: ['', [
            Validators.required,
            this.amountValidator(account),
          ]],
        }))

        return accounts;
      })
    );
  }

  walletValidator(control: AbstractControl): ValidationErrors | null {
    const address: string = control.value;
    if (!address) {
      return null;
    }

    try {
      new PublicKey(address)
    } catch (e) {
      return { 'wallet': e };
    }

    return null;
  }

  amountValidator(account: AssociatedTokenAccount): ValidatorFn {
    return (control) => {
      const amountStr: string = control.value;
      if (!amountStr) {
        return null;
      }

      const amount = Number(amountStr);
      if (isNaN(amount)) {
        return { 'amount': 'NaN' };
      }

      if (amount > account.amount) {
        return { 'amount': 'Insufficient balance' };
      }

      return null;
    }
  }

  getWalletError(wallet: AbstractControl | null) {
    if (wallet == null) {
      return '';
    }

    if (wallet.hasError('required')) {
      return 'You must enter the receiving wallet';
    }

    if (wallet.hasError('wallet')) {
      return 'Invalid wallet address';
    }

    return '';
  }

  getAmountError(amount: AbstractControl | null) {
    if (amount == null) {
      return '';
    }

    if (amount.hasError('required')) {
      return 'You must enter the transfer amount';
    }

    if (amount.hasError('amount')) {
      return amount.getError('amount');
    }

    return '';
  }

  transfer(from: AssociatedTokenAccount, target: FormGroup) {
    const fromWallet = this.walletService.currentWallet;
    if (fromWallet == undefined) {
      this.snackBar.open('Please connect your wallet', 'OK');
      return;
    }

    const owner = fromWallet.publicKey;
    if (owner == null) return;

    const toWalletControl = target.get('toWallet');
    if (toWalletControl == null) return;

    const amountControl = target.get('amount');
    if (amountControl == null) return;

    const toWallet = new PublicKey(toWalletControl.value);
    const toATA = getAssociatedTokenAddressSync(from.mint, toWallet);

    const transactionInstructions: TransactionInstruction[] = new Array();
    getAccount(this.solService.connection, toATA).catch(
      (e) => transactionInstructions.push(
        createAssociatedTokenAccountInstruction(
          owner,
          toATA,
          toWallet,
          from.mint,
        )
      )
    )

    const source = from.pubkey;
    const destination = toATA
    const amount = amountControl.value * Math.pow(10, from.decimals);

    this.solService.transfer(
      source, 
      destination, 
      amount, 
      owner,
      transactionInstructions, 
    ).pipe(
      map((trx) => this.walletService.sendTransaction(trx, this.solService.connection)),
      concatAll(),
    ).subscribe({
      next: (signature) => {
        this.snackBar.openFromComponent(TransactionSnackbarComponent, {
          data: {
            signature: signature,
            network: this.solService.network,
            action: () => this.refreshTokens(),
          }
        })
      },
      error: (err) => console.error(err),
      complete: () => console.log('complete')
    });
  }
}
