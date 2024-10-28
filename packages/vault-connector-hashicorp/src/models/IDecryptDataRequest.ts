// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to decrypt data.
 */
export interface IDecryptDataRequest {
	/**
	 * The ciphertext to be decrypted, encoded in Base64.
	 */
	ciphertext: string;
}
