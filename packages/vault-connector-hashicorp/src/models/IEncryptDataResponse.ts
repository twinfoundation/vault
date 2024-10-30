// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Represents the response received after encrypting.
 */
export interface IEncryptDataResponse {
	/**
	 * The encrypted ciphertext, encoded in Base64.
	 */
	ciphertext: string;
}
