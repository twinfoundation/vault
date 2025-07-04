// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Base interface for all Hashicorp Vault API requests.
 */
export interface IHashicorpVaultRequest<T> {
	/**
	 * The request data.
	 */
	data: {
		secret: T;
	};
}
