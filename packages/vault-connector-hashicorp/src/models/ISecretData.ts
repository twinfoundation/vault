// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Interface for secret data responses.
 */
export interface ISecretData<T> {
	/**
	 * The secret data.
	 */
	data: {
		secret: T;
	};
}
