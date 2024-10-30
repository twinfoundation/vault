// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to restore a key.
 */
export interface IRestoreKeyRequest {
	/**
	 * The backup data of the key to be restored, encoded in Base64.
	 */
	backup: string;
}
