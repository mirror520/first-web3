import { AccountInfo, PublicKey } from "@solana/web3.js";
import { Mint, RawAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { TokenMetadata } from "@solana/spl-token-metadata";

export class Account<T> {
  pubkey: PublicKey;
  info: AccountInfo<Buffer>;
  data: T;

  constructor(
    raw: { 
      account: AccountInfo<Buffer>; 
      pubkey: PublicKey;
    }, 
    data: T,
  ) {
    this.pubkey = raw.pubkey;
    this.info = raw.account;
    this.data = data;
  }
}

export function ToATA<T extends RawAccount>(
  account: Account<T>
): AssociatedTokenAccount {
  return new AssociatedTokenAccount(account);
}

export class AssociatedTokenAccount {
  private _account: Account<RawAccount>;
  private _token: Token | undefined;

  constructor(account: Account<RawAccount>) {
    this._account = account;
  }

  public isToken2022(): boolean {
    return this._account.info.owner.equals(TOKEN_2022_PROGRAM_ID);
  }

  public get account(): RawAccount {
    return this._account.data;
  }

  public get pubkey(): PublicKey {
    return this._account.pubkey;
  }

  public get mint(): PublicKey {
    return this.account.mint;
  }

  public get display_mint(): string {
    const token = this.token;
    if ((token != null) && (token.metadata != null)) {
      return token.metadata.symbol;
    }

    return `${this.mint.toBase58().slice(0, 10)}...`;
  }

  public get amount(): number {
    const amount = Number(this.account.amount);
    return amount / Math.pow(10, this.decimals);
  }

  public set token(value: Token | undefined) {
    this._token = value;
  }

  public get token(): Token | undefined{
    return this._token;
  }

  public get decimals(): number {
    const token = this.token;
    if (token == undefined) {
      return 9;
    }

    return token.mint.decimals;
  }
}

export class Token {
  mint: Mint;
  metadata: TokenMetadata | null;

  constructor(mint: Mint) {
    this.mint = mint;
    this.metadata = null;
  }
}
