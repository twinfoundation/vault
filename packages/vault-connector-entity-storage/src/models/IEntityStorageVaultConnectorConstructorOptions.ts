// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Options for the entity storage vault connector constructor.
 */
export interface IEntityStorageVaultConnectorConstructorOptions {
	/**
	 * The vault key entity storage connector type.
	 * @default vault-key
	 */
	vaultKeyEntityStorageType?: string;

	/**
	 * The vault secret entity storage connector type.
	 * @default vault-secret
	 */
	vaultSecretEntityStorageType?: string;
}
