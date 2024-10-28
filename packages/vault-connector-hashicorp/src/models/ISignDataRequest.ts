// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to sign data.
 */
export interface ISignDataRequest {
	/**
	 * The data to be signed, encoded in Base64.
	 */
	input: string;
}
