// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Represents the response containing the public key.
 */
export interface IGetPublicKeyResponse {
	/**
	 * The public key, encoded in Base64.
	 */
	keys: {
		[version: string]: string;
	};
}
