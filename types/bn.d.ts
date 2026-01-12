declare module 'bn.js' {
  export class BN {
    constructor(number: number | string | number[] | Uint8Array | Buffer | BN, base?: number | 'hex', endian?: 'le' | 'be')
    toString(base?: number | 'hex', length?: number): string
    toNumber(): number
    toArray(endian?: 'le' | 'be', length?: number): number[]
    toArrayLike<T>(ArrayType: new (size: number) => T, endian?: 'le' | 'be', length?: number): T
    toBuffer(endian?: 'le' | 'be', length?: number): Buffer
    bitLength(): number
    zeroBits(): number
    byteLength(): number
    isNeg(): boolean
    isEven(): boolean
    isOdd(): boolean
    isZero(): boolean
    cmp(b: BN): number
    lt(b: BN): boolean
    lte(b: BN): boolean
    gt(b: BN): boolean
    gte(b: BN): boolean
    eq(b: BN): boolean
    add(b: BN): BN
    sub(b: BN): BN
    mul(b: BN): BN
    div(b: BN): BN
    mod(b: BN): BN
    abs(): BN
    neg(): BN
    clone(): BN
  }
}
