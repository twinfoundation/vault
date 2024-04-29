// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Interface describing a vault secret.
 */
export interface IVaultSecret {
	/**
	 * The id.
	 */
	id: string;

	/**
	 * The JSON stringified data for the secret.
	 */
	data: string;
}
