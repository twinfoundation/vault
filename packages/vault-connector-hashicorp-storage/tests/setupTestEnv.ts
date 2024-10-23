// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { Guards } from "@twin.org/core";
import * as dotenv from "dotenv";
import { HashicorpStorageVaultConnector } from "../src/hashicorpStorageVaultConnector";
import type { IHashicorpVaultConnectorConfig } from "../src/models/IHashicorpVaultConnectorConfig";

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

console.debug("Setting up test environment from .env and .env.dev files");

Guards.stringValue("TestEnv", "VAULT_ADDRESS", process.env.VAULT_ADDRESS);
Guards.stringValue("TestEnv", "VAULT_TOKEN", process.env.VAULT_TOKEN);
Guards.stringValue("TestEnv", "VAULT_KV_MOUNT_PATH", process.env.VAULT_KV_MOUNT_PATH);
Guards.stringValue("TestEnv", "VAULT_TRANSIT_MOUNT_PATH", process.env.VAULT_TRANSIT_MOUNT_PATH);

export const TEST_VAULT_CONFIG: IHashicorpVaultConnectorConfig = {
	address: process.env.VAULT_ADDRESS ?? "http://localhost:8200",
	token: process.env.VAULT_TOKEN ?? "root",
	kvMountPath: process.env.VAULT_KV_MOUNT_PATH ?? "secret",
	transitMountPath: process.env.VAULT_TRANSIT_MOUNT_PATH ?? "transit"
};

/**
 * Cleans up the secrets from the vault.
 * @param secretNames - The names of the secrets to clean up.
 */
export async function cleanupSecrets(secretNames: string[]): Promise<void> {
	const vaultConnector = new HashicorpStorageVaultConnector({
		config: TEST_VAULT_CONFIG
	});
	await vaultConnector.bootstrap();

	for (const secretName of secretNames) {
		try {
			await vaultConnector.removeSecret(secretName);
		} catch (error) {
			if (error instanceof Error) {
				console.warn(`Failed to clean up secret ${secretName}: ${error.message}`);
			}
		}
	}
}
