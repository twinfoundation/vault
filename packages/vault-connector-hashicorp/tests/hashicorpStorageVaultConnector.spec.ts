// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { AlreadyExistsError, I18n } from "@twin.org/core";
import { VaultEncryptionType, VaultKeyType } from "@twin.org/vault-models"; // remove this
import { FetchError } from "@twin.org/web";
import { cleanupKeys, cleanupSecrets, TEST_VAULT_CONFIG } from "./setupTestEnv";
import { HashicorpStorageVaultConnector } from "../src/hashicorpStorageVaultConnector";

const TEST_KEY_NAME = "test-key";
// const TEST_SECRET_NAME = "test-secret";

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
		await cleanupSecrets(["test-secret"]);
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
		const secretName = "test-secret";
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

	test("can fail to create a key with no key name", async () => {
		await expect(
			vaultConnector.createKey(undefined as unknown as string, undefined as unknown as VaultKeyType)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});

	test("can fail to create a key with no key type", async () => {
		await expect(
			vaultConnector.createKey(TEST_KEY_NAME, undefined as unknown as VaultKeyType)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.arrayOneOf",
			properties: {
				property: "type",
				value: "undefined"
			}
		});
	});

	test("can fail to create a key if it already exists", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(keyName, keyType);

		await expect(vaultConnector.createKey(keyName, keyType)).rejects.toThrowError(
			AlreadyExistsError
		);

		await cleanupKeys(["test-key"]);
	});

	test("can create and get key", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.Ed25519;

		const publicKey = await vaultConnector.createKey(keyName, keyType);

		expect(publicKey).toBeDefined();
		expect(publicKey.length).toBeGreaterThan(0);

		const retrievedPublicKey = await vaultConnector.getPublicKey(keyName);

		expect(retrievedPublicKey).toEqual(publicKey);
		expect(retrievedPublicKey.length).toBeGreaterThan(0);

		await cleanupKeys(["test-key"]);
	});

	test("can update key configuration to allow deletion", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(keyName, keyType);

		await vaultConnector.updateKeyConfig(keyName, true);

		const deleteConfiguration = await vaultConnector.getKeyDeleteConfiguration(keyName);

		expect(deleteConfiguration).toBeDefined();
		expect(deleteConfiguration).toEqual(true);

		await cleanupKeys(["test-key"]);
	});

	test("can remove a key", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(keyName, keyType);

		await vaultConnector.removeKey(keyName);

		await expect(vaultConnector.getPublicKey(keyName)).rejects.toThrowError(FetchError);
	});

	test("can backup a key", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(keyName, keyType);

		const backup = await vaultConnector.backupKey(keyName);

		expect(backup).toBeDefined();
		expect(typeof backup).toBe("string");
		expect(backup.length).toBeGreaterThan(0);

		await cleanupKeys(["test-key"]);
	});

	test("can restore a key", async () => {
		const originalKeyName = "test-restore-origin-key";
		const restoredKeyNewName = "test-restore-new-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(originalKeyName, keyType);
		const backup = await vaultConnector.backupKey(originalKeyName);

		await vaultConnector.restoreKey(restoredKeyNewName, backup);
		const getOriginalKey = await vaultConnector.getPublicKey(originalKeyName);
		const getRestoredKey = await vaultConnector.getPublicKey(restoredKeyNewName);

		expect(getRestoredKey).toBeDefined();
		expect(getOriginalKey).toEqual(getRestoredKey);

		await cleanupKeys(["test-restore-origin-key", "test-restore-new-key"]);
	});

	test("can rename a key", async () => {
		const originalKeyName = "test-rename-origin-key";
		const newKeyName = "test-rename-new-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(originalKeyName, keyType);

		await vaultConnector.renameKey(originalKeyName, newKeyName);

		// Verify the original key is removed
		await expect(vaultConnector.getPublicKey(originalKeyName)).rejects.toThrowError(FetchError);

		// Verify the renamed key exists
		const renamedKey = await vaultConnector.getPublicKey(newKeyName);

		expect(renamedKey).toBeDefined();
		expect(renamedKey.length).toBeGreaterThan(0);

		await cleanupKeys(["test-rename-new-key"]);
	});

	test("can get a key", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(keyName, keyType);

		const retrievedKey = await vaultConnector.getKey(keyName);

		expect(retrievedKey).toBeDefined();
		expect(retrievedKey.publicKey).toBeDefined();
		expect(retrievedKey.publicKey.length).toBeGreaterThan(0);
		expect(retrievedKey.privateKey).toBeDefined();
		expect(retrievedKey.privateKey.length).toBeGreaterThan(0);
		expect(retrievedKey.type).toEqual(keyType);

		await cleanupKeys(["test-key"]);
	});

	test("can sign and verify data", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(keyName, keyType);

		const data = Buffer.from("test-data");

		const signature = await vaultConnector.sign(keyName, data);

		const isValid = await vaultConnector.verify(keyName, data, signature);

		expect(isValid).toBe(true);

		await cleanupKeys(["test-key"]);
	});

	test("can encrypt and decrypt data", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.ChaCha20Poly1305;
		const encryptionType = VaultEncryptionType.ChaCha20Poly1305;

		await vaultConnector.createKey(keyName, keyType);

		const data = Buffer.from("test-data");

		const encryptedData = await vaultConnector.encrypt(keyName, encryptionType, data);

		expect(encryptedData).toBeDefined();
		expect(encryptedData.length).toBeGreaterThan(0);

		const decryptedData = await vaultConnector.decrypt(keyName, encryptionType, encryptedData);

		expect(decryptedData).toBeDefined();
		expect(decryptedData.length).toBeGreaterThan(0);
		expect(Buffer.from(decryptedData).toString()).toEqual("test-data");

		await cleanupKeys(["test-key"]);
	});
});
