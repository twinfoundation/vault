// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to create a new key in the vault.
 */
export interface ICreateKeyRequest {
	/**
	 * The type of key (e.g., "ed25519").
	 */
	type: string;

	/**
	 * Indicates whether the key is exportable.
	 */
	exportable: boolean;

	/**
	 * Indicates whether the key can be backed up in plaintext.
	 */
	allow_plaintext_backup: boolean;
}
