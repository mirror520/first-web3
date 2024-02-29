import { Routes } from '@angular/router';

import { AirdropComponent } from './airdrop/airdrop.component';
import { TransferComponent } from './transfer/transfer.component';
import { MintComponent } from './mint/mint.component';

export const routes: Routes = [
  { path: 'airdrop', component: AirdropComponent },
  { path: 'transfer', component: TransferComponent },
  { path: 'mint', component: MintComponent },
];
