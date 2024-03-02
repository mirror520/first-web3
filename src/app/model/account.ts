import { PublicKey } from "@solana/web3.js";
import { Mint, RawAccount } from "@solana/spl-token";
import { TokenMetadata } from "@solana/spl-token-metadata";

export class Account<T> {
  pubkey: PublicKey;
  data: T;

  constructor(pubkey: PublicKey, data: T) {
    this.pubkey = pubkey;
    this.data = data;
  }
}

export function ToATA<T extends RawAccount>(
  origin: Account<T>
): AssociatedTokenAccount {
  return new AssociatedTokenAccount(origin);
}

export class AssociatedTokenAccount {
  private _pubkey: PublicKey;
  private _raw: RawAccount;
  private _token: Token | undefined;

  constructor(origin: Account<RawAccount>) {
    this._pubkey = origin.pubkey;
    this._raw = origin.data;
  }

  public get pubkey(): PublicKey {
    return this._pubkey;
  }

  public get mint(): PublicKey {
    return this._raw.mint;
  }

  public get display_mint(): string {
    const mint = this._raw.mint;

    const token = this.token;
    if ((token != null) && (token.metadata != null)) {
      return token.metadata.symbol;
    }

    return `Unknown (${mint.toBase58().slice(0, 10)}...)`;
  }

  public get amount(): number {
    return Number(this._raw.amount);
  }

  public set token(value: Token | undefined) {
    this._token = value;
  }

  public get token(): Token | undefined{
    return this._token;
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
