// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Base interface for all Hashicorp Vault API responses.
 */
export interface IHashicorpVaultResponse<T> {
	/**
	 * The response data.
	 */
	data: T;
}
