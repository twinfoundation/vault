// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Represents the response containing the key.
 */
export interface IExportKeyResponse {
	/**
	 * The public key, encoded in Base64.
	 */
	keys: {
		[version: string]: string;
	};

	/**
	 * The type of the key (e.g., "ed25519").
	 */
	type: string;

	/**
	 * The name of the key.
	 */
	name: string;
}
