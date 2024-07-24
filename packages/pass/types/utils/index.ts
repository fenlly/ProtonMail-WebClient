export type Callback<T extends any[] = any[], R = any> = (...args: T) => R;
export type AsyncCallback<T extends any[] = any[], R extends Promise<any> = Promise<any>> = (...args: T) => R;

export type Maybe<T> = T | undefined;
export type MaybeNull<T> = T | null;
export type MaybeArray<T> = T | T[];
export type MaybePromise<T> = T | Promise<T>;
export type Unpack<T> = T extends (infer U)[] ? U : T extends readonly (infer U)[] ? U : never;

export type RequiredNonNull<T, K extends keyof T = keyof T> = Omit<T, K> & {
    [P in K]-?: P extends K ? NonNullable<T[P]> : T[P];
};
export type RequiredProps<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
export type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> };
export type OptionalProp<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DefinedPropertiesOnly<S extends {}> = Pick<S, DefinedKeys<S>>;
export type DefinedKeys<S extends {}, K = keyof S> = Extract<
    K,
    K extends keyof S ? (S[K] extends undefined ? never : K) : never
>;

export type ColorRGB = `${number} ${number} ${number}`;

/** This type transformer iterates over each property of T and checks if its type
 * matches any of the OriginalTypes in U. If a match is found, the property's type
 * is replaced with the corresponding NewType. If no match is found, the property's
 * type remains unchanged. */
export type TypeMapper<T, U extends [unknown, unknown][]> = T extends U[number][0]
    ? Extract<U[number], [T, unknown]>[1]
    : T extends (infer A)[]
      ? TypeMapper<A, U>[]
      : T extends Record<any, any>
        ? { [K in keyof T]: TypeMapper<T[K], U> }
        : T;
