// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the Memory Vault Provider.
 */
export interface IMemoryVaultProviderConfig {
	/**
	 * Initial values to populate the vault with.
	 */
	initialValues?: { [id: string]: unknown };
}
