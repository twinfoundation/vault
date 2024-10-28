// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Response received after decrypting.
 */
export interface IDecryptDataResponse {
	/**
	 * The decrypted plaintext, encoded in Base64.
	 */
	plaintext: string;
}
