// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { AlreadyExistsError, I18n } from "@twin.org/core";
import { VaultEncryptionType, VaultKeyType } from "@twin.org/vault-models"; // remove this
import { FetchError } from "@twin.org/web";
import { cleanupKeys, cleanupSecrets, TEST_VAULT_CONFIG } from "./setupTestEnv";
import { HashicorpVaultConnector } from "../src/hashicorpVaultConnector";

const TEST_KEY_NAME = "test-key";
const TEST_SECRET_NAME = "test-secret";

let vaultConnector: HashicorpVaultConnector;

describe("HashicorpVaultConnector", () => {
	beforeAll(async () => {
		I18n.addDictionary("en", await import("../locales/en.json"));
	});

	beforeEach(async () => {
		vaultConnector = new HashicorpVaultConnector({
			config: TEST_VAULT_CONFIG
		});
		await vaultConnector.bootstrap();
	});

	test("can construct with dependencies", async () => {
		const vaultConnectorHealth = new HashicorpVaultConnector({
			config: TEST_VAULT_CONFIG
		});

		expect(vaultConnectorHealth).toBeDefined();
	});

	test("can fail to store a secret with no secret name", async () => {
		await expect(
			vaultConnector.setSecret(undefined as unknown as string, undefined as unknown as Uint8Array)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});

	test("can fail to store a secret with no data", async () => {
		await expect(
			vaultConnector.setSecret(TEST_SECRET_NAME, undefined as unknown as Uint8Array)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.undefined",
			properties: {
				property: "data",
				value: "undefined"
			}
		});
	});

	test("can fail to get a secret with no secret name", async () => {
		await expect(vaultConnector.getSecret(undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});

	test("can fail to get a secret that does not exist", async () => {
		await expect(vaultConnector.getSecret(TEST_SECRET_NAME)).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_SECRET_NAME
			}
		});
	});

	test("can fail to remove a secret with no secret name", async () => {
		await expect(vaultConnector.removeSecret(undefined as unknown as string)).rejects.toMatchObject(
			{
				name: "GuardError",
				message: "guard.string",
				properties: {
					property: "name",
					value: "undefined"
				}
			}
		);
	});

	test("can fail to remove a secret that does not exist", async () => {
		await expect(vaultConnector.removeSecret(TEST_SECRET_NAME)).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_SECRET_NAME
			}
		});
	});

	test("can set and get a secret", async () => {
		const secretName = "test-secret";
		const secretData = { key: "value", number: 42 };

		await vaultConnector.setSecret(secretName, secretData);

		const retrievedSecret = await vaultConnector.getSecret<typeof secretData>(secretName);

		expect(retrievedSecret).toBeDefined();
		expect(retrievedSecret.key).toEqual(secretData.key);
		expect(retrievedSecret.number).toEqual(secretData.number);

		await cleanupSecrets(["test-secret"]);
	});

	test("can get the number of secret versions", async () => {
		const secretName = "test-secret";
		const secretData = { key: "value", number: 42 };

		await vaultConnector.setSecret(secretName, secretData);

		const versions = await vaultConnector.getSecretVersions(secretName);

		expect(versions).toBeDefined();
		expect(versions.length).toBeGreaterThanOrEqual(1);

		await cleanupSecrets(["test-secret"]);
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

	test("can fail to get a key with no key name", async () => {
		await expect(vaultConnector.getKey(undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});

	test("can fail to get a key if it doesn't exist", async () => {
		await expect(vaultConnector.getKey(TEST_KEY_NAME)).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
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

	test("can fail to remove a key with no key name", async () => {
		await expect(vaultConnector.removeKey(undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});
	test("can fail to remove a key if it doesn't exist", async () => {
		await expect(vaultConnector.removeKey(TEST_KEY_NAME)).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
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

	test("can fail to rename a key with no key name", async () => {
		await expect(
			vaultConnector.renameKey(undefined as unknown as string, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});
	test("can fail to rename a key with no new key name", async () => {
		await expect(
			vaultConnector.renameKey("foo", undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "newName",
				value: "undefined"
			}
		});
	});
	test("can fail to rename a key if it doesn't exist", async () => {
		await expect(vaultConnector.renameKey(TEST_KEY_NAME, "foo")).rejects.toMatchObject({
			name: "GeneralError",
			properties: {
				name: TEST_KEY_NAME,
				newName: "foo"
			}
		});
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

	test("can sign data with a key", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(keyName, keyType);

		const dataToSign = new Uint8Array([1, 2, 3, 4, 5]);

		const signature = await vaultConnector.sign(keyName, dataToSign);

		expect(signature).toBeDefined();
		expect(signature.length).toBeGreaterThan(0);

		await cleanupKeys(["test-key"]);
	});

	test("can verify siganture with a key", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(keyName, keyType);

		const dataToSign = new Uint8Array([1, 2, 3, 4, 5]);

		const signature = await vaultConnector.sign(keyName, dataToSign);

		const isVerified = await vaultConnector.verify(keyName, dataToSign, signature);

		expect(isVerified).toBe(true);

		await cleanupKeys(["test-key"]);
	});

	test("can fail to verify signature with a key", async () => {
		const keyName = "test-key";
		const keyType = VaultKeyType.Ed25519;

		await vaultConnector.createKey(keyName, keyType);

		const dataToSign = new Uint8Array([1, 2, 3, 4, 5]);
		const invalidData = new Uint8Array([5, 4, 3, 2, 1]);

		const signature = await vaultConnector.sign(keyName, dataToSign);

		const isVerified = await vaultConnector.verify(keyName, invalidData, signature);

		expect(isVerified).toBe(false);

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

	test("can fail to sign with a key with no key name", async () => {
		await expect(
			vaultConnector.sign(undefined as unknown as string, undefined as unknown as Uint8Array)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});
	test("can fail to sign with a key with no data", async () => {
		await expect(
			vaultConnector.sign(TEST_KEY_NAME, undefined as unknown as Uint8Array)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.uint8Array",
			properties: {
				property: "data",
				value: "undefined"
			}
		});
	});
	test("can fail to sign with a key if it doesn't exist", async () => {
		await expect(vaultConnector.sign(TEST_KEY_NAME, new Uint8Array())).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});
	test("can fail to verify with a key with no key name", async () => {
		await expect(
			vaultConnector.verify(
				undefined as unknown as string,
				undefined as unknown as Uint8Array,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});
	test("can fail to verify with a key with no data", async () => {
		await expect(
			vaultConnector.verify(
				TEST_KEY_NAME,
				undefined as unknown as Uint8Array,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.uint8Array",
			properties: {
				property: "data",
				value: "undefined"
			}
		});
	});
	test("can fail to verify with a key with no signature", async () => {
		await expect(
			vaultConnector.verify(TEST_KEY_NAME, new Uint8Array(), undefined as unknown as Uint8Array)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.uint8Array",
			properties: {
				property: "signature",
				value: "undefined"
			}
		});
	});
	test("can fail to verify with a key if it doesn't exist", async () => {
		await expect(
			vaultConnector.verify(TEST_KEY_NAME, new Uint8Array(), new Uint8Array())
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
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

	test("can fail to encrypt with a key with no key name", async () => {
		await expect(
			vaultConnector.encrypt(
				undefined as unknown as string,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});

	test("can fail to encrypt with a key with no encryption type", async () => {
		await expect(
			vaultConnector.encrypt(
				TEST_KEY_NAME,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.arrayOneOf",
			properties: {
				property: "encryptionType",
				value: "undefined"
			}
		});
	});

	test("can fail to encrypt with a key with no data", async () => {
		await expect(
			vaultConnector.encrypt(
				TEST_KEY_NAME,
				VaultEncryptionType.ChaCha20Poly1305,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.uint8Array",
			properties: {
				property: "data",
				value: "undefined"
			}
		});
	});

	test("can fail to encrypt with a key if it doesn't exist", async () => {
		await expect(
			vaultConnector.encrypt(TEST_KEY_NAME, VaultEncryptionType.ChaCha20Poly1305, new Uint8Array())
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can fail to decrypt with a key with no key name", async () => {
		await expect(
			vaultConnector.decrypt(
				undefined as unknown as string,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});

	test("can fail to decrypt with a key with no encryption type", async () => {
		await expect(
			vaultConnector.decrypt(
				TEST_KEY_NAME,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.arrayOneOf",
			properties: {
				property: "encryptionType",
				value: "undefined"
			}
		});
	});

	test("can fail to decrypt with a key with no data", async () => {
		await expect(
			vaultConnector.decrypt(
				TEST_KEY_NAME,
				VaultEncryptionType.ChaCha20Poly1305,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.uint8Array",
			properties: {
				property: "encryptedData",
				value: "undefined"
			}
		});
	});

	test("can fail to decrypt with a key if it doesn't exist", async () => {
		await expect(
			vaultConnector.decrypt(TEST_KEY_NAME, VaultEncryptionType.ChaCha20Poly1305, new Uint8Array())
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});
});
