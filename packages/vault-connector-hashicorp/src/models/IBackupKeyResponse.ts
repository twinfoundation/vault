// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Represents the response received after backing up a key in the Vault.
 */
export interface IBackupKeyResponse {
	/**
	 * The backup data of the key, encoded in Base64.
	 */
	backup: string;
}
