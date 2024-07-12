// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter } from "@gtsc/core";
import { EntitySchemaFactory, EntitySchemaHelper } from "@gtsc/entity";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import { VaultEncryptionType, VaultKeyType } from "@gtsc/vault-models";
import { VaultKey } from "../src/entities/vaultKey";
import { VaultSecret } from "../src/entities/vaultSecret";
import { EntityStorageVaultConnector } from "../src/entityStorageVaultConnector";

const TEST_PARTITION_ID = "test-partition";
const TEST_IDENTITY_ID = "test-identity";
const TEST_KEY_NAME = "test-key";
const TEST_SECRET_NAME = "test-secret";
const TEST_CONTEXT = { partitionId: TEST_PARTITION_ID, identity: TEST_IDENTITY_ID };

let vaultKeyEntityStorageConnector: MemoryEntityStorageConnector<VaultKey>;
let vaultSecretEntityStorageConnector: MemoryEntityStorageConnector<VaultSecret>;

describe("EntityStorageVaultConnector", () => {
	beforeAll(() => {
		EntitySchemaFactory.register(nameof<VaultKey>(), () => EntitySchemaHelper.getSchema(VaultKey));
		EntitySchemaFactory.register(nameof<VaultSecret>(), () =>
			EntitySchemaHelper.getSchema(VaultSecret)
		);
	});

	beforeEach(() => {
		vaultKeyEntityStorageConnector = new MemoryEntityStorageConnector<VaultKey>({
			entitySchema: nameof(VaultKey)
		});
		vaultSecretEntityStorageConnector = new MemoryEntityStorageConnector<VaultSecret>({
			entitySchema: nameof(VaultSecret)
		});

		EntityStorageConnectorFactory.register("vault-key", () => vaultKeyEntityStorageConnector);
		EntityStorageConnectorFactory.register("vault-secret", () => vaultSecretEntityStorageConnector);
	});

	afterEach(() => {
		EntityStorageConnectorFactory.unregister("vault-key");
		EntityStorageConnectorFactory.unregister("vault-secret");
	});

	test("can construct with dependencies", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		expect(vaultConnector).toBeDefined();
	});

	test("can fail to create a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.createKey(
				undefined as unknown as string,
				undefined as unknown as VaultKeyType,
				TEST_CONTEXT
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

	test("can fail to create a key with no key type", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.createKey(TEST_KEY_NAME, undefined as unknown as VaultKeyType, TEST_CONTEXT)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.arrayOneOf",
			properties: {
				property: "type",
				value: "undefined"
			}
		});
	});

	test("can fail to create a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.createKey(TEST_KEY_NAME, VaultKeyType.Ed25519, {
				partitionId: TEST_PARTITION_ID
			})
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can fail to create a key if it already exists", async () => {
		await vaultKeyEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
				type: VaultKeyType.Ed25519,
				privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag=",
				publicKey: "KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y="
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.createKey(TEST_KEY_NAME, VaultKeyType.Ed25519, TEST_CONTEXT)
		).rejects.toMatchObject({
			name: "AlreadyExistsError",
			properties: {
				existingId: "test-key"
			}
		});
	});

	test("can create a key", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		const key = await vaultConnector.createKey(TEST_KEY_NAME, VaultKeyType.Ed25519, TEST_CONTEXT);

		expect(key.length).toEqual(32);

		const store = vaultKeyEntityStorageConnector.getStore(TEST_PARTITION_ID);

		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`);
		expect(store?.[0].type).toEqual(VaultKeyType.Ed25519);
		expect(Converter.base64ToBytes(store?.[0].privateKey ?? "").length).toEqual(32);
		expect(Converter.base64ToBytes(store?.[0].publicKey ?? "").length).toEqual(32);
	});

	test("can fail to add a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.addKey(
				undefined as unknown as string,
				undefined as unknown as VaultKeyType,
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

	test("can fail to add a key with no key type", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.addKey(
				TEST_KEY_NAME,
				undefined as unknown as VaultKeyType,
				undefined as unknown as Uint8Array,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.arrayOneOf",
			properties: {
				property: "type",
				value: "undefined"
			}
		});
	});

	test("can fail to add a key with no private key", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.addKey(
				TEST_KEY_NAME,
				VaultKeyType.Ed25519,
				undefined as unknown as Uint8Array,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.uint8Array",
			properties: {
				property: "privateKey",
				value: "undefined"
			}
		});
	});

	test("can fail to add a key with no public key", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.addKey(
				TEST_KEY_NAME,
				VaultKeyType.Ed25519,
				new Uint8Array(),
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.uint8Array",
			properties: {
				property: "publicKey",
				value: "undefined"
			}
		});
	});

	test("can fail to add a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.addKey(
				TEST_KEY_NAME,
				VaultKeyType.Ed25519,
				new Uint8Array(),
				new Uint8Array(),
				{ partitionId: TEST_PARTITION_ID }
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can fail to add a key if it already exists", async () => {
		await vaultKeyEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
				type: VaultKeyType.Ed25519,
				privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag=",
				publicKey: "KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y="
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.addKey(
				TEST_KEY_NAME,
				VaultKeyType.Ed25519,
				new Uint8Array(),
				new Uint8Array(),
				TEST_CONTEXT
			)
		).rejects.toMatchObject({
			name: "AlreadyExistsError",
			properties: {
				existingId: "test-key"
			}
		});
	});

	test("can add a key", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await vaultConnector.addKey(
			TEST_KEY_NAME,
			VaultKeyType.Ed25519,
			Converter.base64ToBytes("vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag="),
			Converter.base64ToBytes("KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y="),
			TEST_CONTEXT
		);

		const store = vaultKeyEntityStorageConnector.getStore(TEST_PARTITION_ID);

		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`);
		expect(store?.[0].type).toEqual(VaultKeyType.Ed25519);
		expect(Converter.base64ToBytes(store?.[0].privateKey ?? "").length).toEqual(32);
		expect(Converter.base64ToBytes(store?.[0].publicKey ?? "").length).toEqual(32);
	});

	test("can fail to get a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.getKey(undefined as unknown as string, TEST_CONTEXT)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});

	test("can fail to get a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.getKey(TEST_KEY_NAME, { partitionId: TEST_PARTITION_ID })
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can fail to get a key if it doesn't exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(vaultConnector.getKey(TEST_KEY_NAME, TEST_CONTEXT)).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can get a key", async () => {
		await vaultKeyEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
				type: VaultKeyType.Ed25519,
				privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag=",
				publicKey: "KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y="
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		const key = await vaultConnector.getKey(TEST_KEY_NAME, TEST_CONTEXT);

		expect(key.type).toEqual(VaultKeyType.Ed25519);
		expect(key.privateKey).toEqual(
			Converter.base64ToBytes("vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag=")
		);
		expect(key.publicKey).toEqual(
			Converter.base64ToBytes("KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y=")
		);
	});

	test("can fail to rename a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.renameKey(
				undefined as unknown as string,
				undefined as unknown as string,
				TEST_CONTEXT
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

	test("can fail to rename a key with no new key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.renameKey("foo", undefined as unknown as string, TEST_CONTEXT)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "newName",
				value: "undefined"
			}
		});
	});

	test("can fail to rename a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.renameKey(TEST_KEY_NAME, "foo", {
				partitionId: TEST_PARTITION_ID
			})
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can fail to rename a key if it doesn't exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.renameKey(TEST_KEY_NAME, "foo", TEST_CONTEXT)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can rename a key", async () => {
		await vaultKeyEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
				type: VaultKeyType.Ed25519,
				privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag=",
				publicKey: "KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y="
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		await vaultConnector.renameKey(TEST_KEY_NAME, "key2", TEST_CONTEXT);

		const store = vaultKeyEntityStorageConnector.getStore(TEST_PARTITION_ID);

		expect(store?.length).toEqual(1);
		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/key2`);
	});

	test("can fail to remove a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(vaultConnector.removeKey(undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});

	test("can fail to remove a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.removeKey(TEST_KEY_NAME, { partitionId: TEST_PARTITION_ID })
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can fail to remove a key if it doesn't exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(vaultConnector.removeKey(TEST_KEY_NAME, TEST_CONTEXT)).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can remove a key", async () => {
		await vaultKeyEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
				type: VaultKeyType.Ed25519,
				privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag=",
				publicKey: "KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y="
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		await vaultConnector.removeKey(TEST_KEY_NAME, TEST_CONTEXT);

		const store = vaultKeyEntityStorageConnector.getStore(TEST_PARTITION_ID);

		expect(store?.length).toEqual(0);
	});

	test("can fail to sign with a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

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
		const vaultConnector = new EntityStorageVaultConnector();

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

	test("can fail to sign with a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.sign(TEST_KEY_NAME, new Uint8Array(), {
				partitionId: TEST_PARTITION_ID
			})
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can fail to sign with a key if it doesn't exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.sign(TEST_KEY_NAME, new Uint8Array(), TEST_CONTEXT)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can sign with a key", async () => {
		await vaultKeyEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
				type: VaultKeyType.Ed25519,
				privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag=",
				publicKey: "KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y="
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		const signature = await vaultConnector.sign(
			TEST_KEY_NAME,
			new Uint8Array([1, 2, 3, 4, 5]),
			TEST_CONTEXT
		);

		expect(signature).toEqual(
			Converter.base64ToBytes(
				"GEuFjhVIS10sF9ocBgbSCwSccgvM+yw30cAOIgD+AVLanSSM+59pw45vkAIszsPhMRd0GMZ/vwjWJHAgFMC0BA=="
			)
		);
	});

	test("can fail to verify with a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

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
		const vaultConnector = new EntityStorageVaultConnector();

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
		const vaultConnector = new EntityStorageVaultConnector();

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

	test("can fail to verify with a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.verify(TEST_KEY_NAME, new Uint8Array(), new Uint8Array(), {
				partitionId: TEST_PARTITION_ID
			})
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});
	test("can fail to verify with a key if it doesn't exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.verify(TEST_KEY_NAME, new Uint8Array(), new Uint8Array(), TEST_CONTEXT)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can verify with a key", async () => {
		await vaultKeyEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
				type: VaultKeyType.Ed25519,
				privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag=",
				publicKey: "KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y="
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		const verified = await vaultConnector.verify(
			TEST_KEY_NAME,
			new Uint8Array([1, 2, 3, 4, 5]),
			Converter.base64ToBytes(
				"GEuFjhVIS10sF9ocBgbSCwSccgvM+yw30cAOIgD+AVLanSSM+59pw45vkAIszsPhMRd0GMZ/vwjWJHAgFMC0BA=="
			),
			TEST_CONTEXT
		);

		expect(verified).toEqual(true);
	});

	test("can fail to encrypt with a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.encrypt(
				undefined as unknown as string,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array,
				TEST_CONTEXT
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
		const vaultConnector = new EntityStorageVaultConnector();

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
		const vaultConnector = new EntityStorageVaultConnector();

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

	test("can fail to encrypt with a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.encrypt(
				TEST_KEY_NAME,
				VaultEncryptionType.ChaCha20Poly1305,
				new Uint8Array(),
				{ partitionId: TEST_PARTITION_ID }
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can fail to encrypt with a key if it doesn't exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.encrypt(
				TEST_KEY_NAME,
				VaultEncryptionType.ChaCha20Poly1305,
				new Uint8Array(),
				TEST_CONTEXT
			)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can encrypt with a key", async () => {
		await vaultKeyEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
				type: VaultKeyType.Ed25519,
				privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag=",
				publicKey: "KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y="
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		const encrypted = await vaultConnector.encrypt(
			TEST_KEY_NAME,
			VaultEncryptionType.ChaCha20Poly1305,
			new Uint8Array([1, 2, 3, 4, 5]),
			TEST_CONTEXT
		);

		expect(encrypted.length).toEqual(33);
	});

	test("can fail to decrypt with a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

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
		const vaultConnector = new EntityStorageVaultConnector();

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
		const vaultConnector = new EntityStorageVaultConnector();

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

	test("can fail to decrypt with a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.decrypt(
				TEST_KEY_NAME,
				VaultEncryptionType.ChaCha20Poly1305,
				new Uint8Array(),
				{ partitionId: TEST_PARTITION_ID }
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can fail to decrypt with a key if it doesn't exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.decrypt(
				TEST_KEY_NAME,
				VaultEncryptionType.ChaCha20Poly1305,
				new Uint8Array(),
				TEST_CONTEXT
			)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can decrypt with a key", async () => {
		await vaultKeyEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
				type: VaultKeyType.Ed25519,
				privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag=",
				publicKey: "KylrGqIEfx7mRdQKNhu+o0l0MU/WilWkOQ2YhkhYC5Y="
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		const decrypted = await vaultConnector.decrypt(
			TEST_KEY_NAME,
			VaultEncryptionType.ChaCha20Poly1305,
			Converter.base64ToBytes("Q1wjsT0rCM1fPLl+tC6xERiUEI6vk39DyXT6AnZjdeHp"),
			TEST_CONTEXT
		);

		expect(decrypted).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
	});

	test("can fail to store a secret with no secret name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

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

	test("can fail to store a secret with no item", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.setSecret(TEST_SECRET_NAME, undefined as unknown as Uint8Array)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "item",
				value: "undefined"
			}
		});
	});

	test("can fail to store a secret with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.setSecret(
				TEST_SECRET_NAME,
				{ foo: "bar" },
				{
					partitionId: TEST_PARTITION_ID
				}
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can store a secret", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await vaultConnector.setSecret(TEST_SECRET_NAME, { foo: "bar" }, TEST_CONTEXT);

		const store = vaultSecretEntityStorageConnector.getStore(TEST_PARTITION_ID);

		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/${TEST_SECRET_NAME}`);
		expect(store?.[0].data).toEqual(JSON.stringify({ foo: "bar" }));
	});

	test("can fail to get a secret with no secret name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(vaultConnector.getSecret(undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "name",
				value: "undefined"
			}
		});
	});

	test("can fail to get a secret with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.getSecret(TEST_SECRET_NAME, { partitionId: TEST_PARTITION_ID })
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can fail to get a secret that does not exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(vaultConnector.getSecret(TEST_SECRET_NAME, TEST_CONTEXT)).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_SECRET_NAME
			}
		});
	});

	test("can get a secret", async () => {
		await vaultSecretEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_SECRET_NAME}`,
				data: JSON.stringify({ foo: "bar" })
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		const secret = await vaultConnector.getSecret(TEST_SECRET_NAME, TEST_CONTEXT);

		expect(secret).toEqual({ foo: "bar" });
	});

	test("can fail to remove a secret with no secret name", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

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

	test("can fail to remove a secret with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(
			vaultConnector.removeSecret(TEST_SECRET_NAME, {
				partitionId: TEST_PARTITION_ID
			})
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.identity",
				value: "undefined"
			}
		});
	});

	test("can fail to remove a secret that does not exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector();

		await expect(vaultConnector.removeSecret(TEST_SECRET_NAME, TEST_CONTEXT)).rejects.toMatchObject(
			{
				name: "NotFoundError",
				properties: {
					notFoundId: TEST_SECRET_NAME
				}
			}
		);
	});

	test("can remove a secret", async () => {
		await vaultSecretEntityStorageConnector.set(
			{
				id: `${TEST_IDENTITY_ID}/${TEST_SECRET_NAME}`,
				data: JSON.stringify({ foo: "bar" })
			},
			TEST_CONTEXT
		);

		const vaultConnector = new EntityStorageVaultConnector();

		await vaultConnector.removeSecret(TEST_SECRET_NAME, TEST_CONTEXT);

		const store = vaultSecretEntityStorageConnector.getStore(TEST_PARTITION_ID);

		expect(store?.[0]).toBeUndefined();
	});
});
