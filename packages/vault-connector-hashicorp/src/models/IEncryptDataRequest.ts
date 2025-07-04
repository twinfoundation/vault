// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to encrypt data.
 */
export interface IEncryptDataRequest {
	/**
	 * The plaintext to be encrypted, encoded in Base64.
	 */
	plaintext: string;
}
