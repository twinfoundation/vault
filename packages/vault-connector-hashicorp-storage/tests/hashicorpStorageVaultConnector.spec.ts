// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { I18n } from "@twin.org/core";
import { cleanupSecrets, TEST_VAULT_CONFIG } from "./setupTestEnv";
import { HashicorpStorageVaultConnector } from "../src/hashicorpStorageVaultConnector";

let vaultConnector: HashicorpStorageVaultConnector;

describe("EntityStorageVaultConnector", () => {
	beforeAll(async () => {
		I18n.addDictionary("en", await import("../locales/en.json"));
	});

	beforeEach(async () => {
		vaultConnector = new HashicorpStorageVaultConnector({
			config: TEST_VAULT_CONFIG
		});
		await vaultConnector.bootstrap();
	});

	afterEach(async () => {
		await cleanupSecrets(["test-secret", "test-secret-versions"]);
	});

	test("can set and get a secret", async () => {
		const secretName = "test-secret";
		const secretData = { key: "value", number: 42 };

		await vaultConnector.setSecret(secretName, secretData);

		const retrievedSecret = await vaultConnector.getSecret<typeof secretData>(secretName);

		expect(retrievedSecret).toBeDefined();
		expect(retrievedSecret.key).toEqual(secretData.key);
		expect(retrievedSecret.number).toEqual(secretData.number);
	});

	test("can get the number of secret versions", async () => {
		const secretName = "test-secret-versions";
		const secretData = { key: "value", number: 42 };

		await vaultConnector.setSecret(secretName, secretData);

		const versions = await vaultConnector.getSecretVersions(secretName);

		expect(versions).toBeDefined();
		expect(versions.length).toBeGreaterThanOrEqual(1);
	});

	test("can remove a secret", async () => {
		const secretName = "test-secret";
		const secretData = { key: "value", number: 42 };

		await vaultConnector.setSecret(secretName, secretData);
		await vaultConnector.removeSecret(secretName);

		await expect(vaultConnector.getSecret(secretName)).rejects.toThrowError();
	});
});
