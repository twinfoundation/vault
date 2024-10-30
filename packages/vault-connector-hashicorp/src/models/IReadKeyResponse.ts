// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Represents the response payload for reading a key from the Vault.
 */
export interface IReadKeyResponse {
	/**
	 * The name of the key.
	 */
	name: string;

	/**
	 * The type of the key.
	 */
	type: string;
}
