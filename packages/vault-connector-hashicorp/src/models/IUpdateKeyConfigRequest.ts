// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to update the configuration of a key.
 */
export interface IUpdateKeyConfigRequest {
	/**
	 * Indicates whether the key is allowed to be deleted.
	 */
	deletion_allowed?: boolean;

	/**
	 * Indicates whether the key is allowed to be exported.
	 */
	exportable?: boolean;
}
