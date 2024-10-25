// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the Hashicorp Vault Connector.
 */
export interface IHashicorpVaultConnectorConfig {
	/**
	 * The address of the Hashicorp Vault (e.g., "http://localhost:8200").
	 */
	endpoint: string;

	/**
	 * The authentication token for the Hashicorp Vault.
	 */
	token: string;

	/**
	 * The mount path for the KV Secrets Engine (e.g., "secret)
	 */
	kvMountPath?: string;

	/**
	 * The mount path for the Transit Secrets Engine (e.g., "transit").
	 */
	transitMountPath?: string;

	/**
	 * The version of the Hashicorp Vault API (e.g., "v1").
	 */
	apiVersion?: string;

	/**
	 * The request timeout in milliseconds.
	 */
	timeout?: number;

	/**
	 * The namespace for the Hashicorp Vault if using Vault Enterprise.
	 */
	namespace?: string;
}
