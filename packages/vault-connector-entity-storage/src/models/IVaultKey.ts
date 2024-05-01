// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { VaultKeyType } from "@gtsc/vault-models";

/**
 * Interface describing a vault key.
 */
export interface IVaultKey {
	/**
	 * The id.
	 */
	id: string;

	/**
	 * The type of the key e.g. Ed25519.
	 */
	type: VaultKeyType;

	/**
	 * The private key in base64 format.
	 */
	privateKey: string;

	/**
	 * The public key in base64 format.
	 */
	publicKey: string;
}
