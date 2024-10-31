// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Interface for secret data responses.
 */
export interface ISecretData {
	/**
	 * The secret data.
	 */
	data: {
		base64: string;
	};
}
