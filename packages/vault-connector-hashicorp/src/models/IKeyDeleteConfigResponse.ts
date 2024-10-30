// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Represents the response payload for deleting a key from the Vault.
 */
export interface IKeyDeleteConfigResponse {
	/**
	 * Indicates whether the deletion is allowed.
	 */
	deletion_allowed: boolean;
}
