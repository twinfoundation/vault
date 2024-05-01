// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter } from "@gtsc/core";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import type { IEntityStorageConnector } from "@gtsc/entity-storage-models";
import type { IRequestContext } from "@gtsc/services";
import type { VaultEncryptionType, VaultKeyType } from "@gtsc/vault-models";
import { EntityStorageVaultConnector } from "../src/entityStorageVaultConnector";
import type { IVaultKey } from "../src/models/IVaultKey";
import type { IVaultSecret } from "../src/models/IVaultSecret";
import { VaultKeyDescriptor } from "../src/models/vaultKeyDescriptor";
import { VaultSecretDescriptor } from "../src/models/vaultSecretDescriptor";

const TEST_TENANT_ID = "test-tenant";
const TEST_IDENTITY_ID = "test-identity";
const TEST_KEY_NAME = "test-key";
const TEST_SECRET_NAME = "test-secret";

let vaultKeyEntityStorageConnector: MemoryEntityStorageConnector<IVaultKey>;
let vaultSecretEntityStorageConnector: MemoryEntityStorageConnector<IVaultSecret>;

describe("EntityStorageVaultConnector", () => {
	beforeEach(() => {
		vaultKeyEntityStorageConnector = new MemoryEntityStorageConnector<IVaultKey>(
			VaultKeyDescriptor
		);
		vaultSecretEntityStorageConnector = new MemoryEntityStorageConnector<IVaultSecret>(
			VaultSecretDescriptor
		);
	});
	test("can fail to construct with no dependencies", async () => {
		expect(
			() =>
				new EntityStorageVaultConnector(
					undefined as unknown as {
						vaultKeyEntityStorageConnector: IEntityStorageConnector<IVaultKey>;
						vaultSecretEntityStorageConnector: IEntityStorageConnector<IVaultSecret>;
					}
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "dependencies",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct with no vault key entity storage", async () => {
		expect(
			() =>
				new EntityStorageVaultConnector(
					{} as unknown as {
						vaultKeyEntityStorageConnector: IEntityStorageConnector<IVaultKey>;
						vaultSecretEntityStorageConnector: IEntityStorageConnector<IVaultSecret>;
					}
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "dependencies.vaultKeyEntityStorageConnector",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct with no vault secret entity storage", async () => {
		expect(
			() =>
				new EntityStorageVaultConnector({ vaultKeyEntityStorageConnector: {} } as unknown as {
					vaultKeyEntityStorageConnector: IEntityStorageConnector<IVaultKey>;
					vaultSecretEntityStorageConnector: IEntityStorageConnector<IVaultSecret>;
				})
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "dependencies.vaultSecretEntityStorageConnector",
					value: "undefined"
				}
			})
		);
	});

	test("can construct with dependencies", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		expect(vaultConnector).toBeDefined();
	});

	test("can fail to create a key with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.createKey(
				undefined as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultKeyType
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to create a key with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.createKey(
				{} as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultKeyType
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to create a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.createKey(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultKeyType
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

	test("can fail to create a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.createKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				undefined as unknown as string,
				undefined as unknown as VaultKeyType
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.createKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				undefined as unknown as VaultKeyType
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

	test("can fail to create a key if it already exists", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector: new MemoryEntityStorageConnector<IVaultKey>(
				VaultKeyDescriptor,
				{
					initialValues: {
						[TEST_TENANT_ID]: [
							{
								id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
								type: "Ed25519",
								privateKey:
									"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
								publicKey: "v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
							}
						]
					}
				}
			),
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.createKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				"Ed25519"
			)
		).rejects.toMatchObject({
			name: "AlreadyExistsError",
			properties: {
				existingId: "test-key"
			}
		});
	});

	test("can create a key", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		const key = await vaultConnector.createKey(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_KEY_NAME,
			"Ed25519"
		);

		expect(key.length).toEqual(32);

		const store = vaultKeyEntityStorageConnector.getStore(TEST_TENANT_ID);

		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`);
		expect(store?.[0].type).toEqual("Ed25519");
		expect(Converter.base64ToBytes(store?.[0].privateKey ?? "").length).toEqual(64);
		expect(Converter.base64ToBytes(store?.[0].publicKey ?? "").length).toEqual(32);
	});

	test("can fail to add a key with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.addKey(
				undefined as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultKeyType,
				undefined as unknown as string,
				undefined as unknown as string
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to add a key with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.addKey(
				{} as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultKeyType,
				undefined as unknown as string,
				undefined as unknown as string
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to add a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.addKey(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultKeyType,
				undefined as unknown as string,
				undefined as unknown as string
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

	test("can fail to add a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.addKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				undefined as unknown as string,
				undefined as unknown as VaultKeyType,
				undefined as unknown as string,
				undefined as unknown as string
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.addKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				undefined as unknown as VaultKeyType,
				undefined as unknown as string,
				undefined as unknown as string
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.addKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				"Ed25519",
				undefined as unknown as string,
				undefined as unknown as string
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "privateKey",
				value: "undefined"
			}
		});
	});

	test("can fail to add a key with no public key", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.addKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				"Ed25519",
				"foo",
				undefined as unknown as string
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "publicKey",
				value: "undefined"
			}
		});
	});

	test("can fail to add a key if it already exists", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector: new MemoryEntityStorageConnector<IVaultKey>(
				VaultKeyDescriptor,
				{
					initialValues: {
						[TEST_TENANT_ID]: [
							{
								id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
								type: "Ed25519",
								privateKey:
									"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
								publicKey: "v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
							}
						]
					}
				}
			),
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.addKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				"Ed25519",
				"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
				"v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
			)
		).rejects.toMatchObject({
			name: "AlreadyExistsError",
			properties: {
				existingId: "test-key"
			}
		});
	});

	test("can add a key", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await vaultConnector.addKey(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_KEY_NAME,
			"Ed25519",
			"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
			"v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
		);

		const store = vaultKeyEntityStorageConnector.getStore(TEST_TENANT_ID);

		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`);
		expect(store?.[0].type).toEqual("Ed25519");
		expect(Converter.base64ToBytes(store?.[0].privateKey ?? "").length).toEqual(64);
		expect(Converter.base64ToBytes(store?.[0].publicKey ?? "").length).toEqual(32);
	});

	test("can fail to get a key with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.getKey(undefined as unknown as IRequestContext, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to get a key with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.getKey({} as unknown as IRequestContext, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to get a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.getKey(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string
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

	test("can fail to get a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.getKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				undefined as unknown as string
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

	test("can fail to get a key if it doesn't exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.getKey({ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID }, TEST_KEY_NAME)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can get a key", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector: new MemoryEntityStorageConnector<IVaultKey>(
				VaultKeyDescriptor,
				{
					initialValues: {
						[TEST_TENANT_ID]: [
							{
								id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
								type: "Ed25519",
								privateKey:
									"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
								publicKey: "v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
							}
						]
					}
				}
			),
			vaultSecretEntityStorageConnector
		});

		const key = await vaultConnector.getKey(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_KEY_NAME
		);

		expect(key.type).toEqual("Ed25519");
		expect(key.privateKey).toEqual(
			"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ=="
		);
		expect(key.publicKey).toEqual("v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU=");
	});

	test("can fail to rename a key with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.renameKey(
				undefined as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as string
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to rename a key with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.renameKey(
				{} as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as string
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to rename a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.renameKey(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as string
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

	test("can fail to rename a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.renameKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				undefined as unknown as string,
				undefined as unknown as string
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.renameKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				"foo",
				undefined as unknown as string
			)
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.renameKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				"foo"
			)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can rename a key", async () => {
		vaultKeyEntityStorageConnector = new MemoryEntityStorageConnector<IVaultKey>(
			VaultKeyDescriptor,
			{
				initialValues: {
					[TEST_TENANT_ID]: [
						{
							id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
							type: "Ed25519",
							privateKey:
								"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
							publicKey: "v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
						}
					]
				}
			}
		);

		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await vaultConnector.renameKey(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_KEY_NAME,
			"key2"
		);

		const store = vaultKeyEntityStorageConnector.getStore(TEST_TENANT_ID);

		expect(store?.length).toEqual(1);
		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/key2`);
	});

	test("can fail to remove a key with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.removeKey(
				undefined as unknown as IRequestContext,
				undefined as unknown as string
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to remove a key with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.removeKey({} as unknown as IRequestContext, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to remove a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.removeKey(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string
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

	test("can fail to remove a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.removeKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				undefined as unknown as string
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

	test("can fail to remove a key if it doesn't exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.removeKey(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME
			)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can remove a key", async () => {
		vaultKeyEntityStorageConnector = new MemoryEntityStorageConnector<IVaultKey>(
			VaultKeyDescriptor,
			{
				initialValues: {
					[TEST_TENANT_ID]: [
						{
							id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
							type: "Ed25519",
							privateKey:
								"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
							publicKey: "v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
						}
					]
				}
			}
		);
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await vaultConnector.removeKey(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_KEY_NAME
		);

		const store = vaultKeyEntityStorageConnector.getStore(TEST_TENANT_ID);

		expect(store?.length).toEqual(0);
	});

	test("can fail to sign with a key with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.sign(
				undefined as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to sign with a key with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.sign(
				{} as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to sign with a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.sign(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as Uint8Array
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

	test("can fail to sign with a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.sign(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				undefined as unknown as string,
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

	test("can fail to sign with a key with no data", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.sign(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
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

	test("can fail to sign with a key if it doesn't exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.sign(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				new Uint8Array()
			)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can sign with a key", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector: new MemoryEntityStorageConnector<IVaultKey>(
				VaultKeyDescriptor,
				{
					initialValues: {
						[TEST_TENANT_ID]: [
							{
								id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
								type: "Ed25519",
								privateKey:
									"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
								publicKey: "v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
							}
						]
					}
				}
			),
			vaultSecretEntityStorageConnector
		});

		const signature = await vaultConnector.sign(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_KEY_NAME,
			new Uint8Array([1, 2, 3, 4, 5])
		);

		expect(Converter.bytesToBase64(signature)).toEqual(
			"xYHh6iMIUHWdAUcgj6ZiAVtpwl03k730MhupevDePA3OrDZ+8GsoVoOC+0MGSm75C1m6cnE9AlTHRcMWnN7rBQ=="
		);
	});

	test("can fail to verify with a key with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.verify(
				undefined as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as Uint8Array,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to verify with a key with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.verify(
				{} as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as Uint8Array,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to verify with a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.verify(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as Uint8Array,
				undefined as unknown as Uint8Array
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

	test("can fail to verify with a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.verify(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.verify(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.verify(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				new Uint8Array(),
				undefined as unknown as Uint8Array
			)
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.verify(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				new Uint8Array(),
				new Uint8Array()
			)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can verify with a key", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector: new MemoryEntityStorageConnector<IVaultKey>(
				VaultKeyDescriptor,
				{
					initialValues: {
						[TEST_TENANT_ID]: [
							{
								id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
								type: "Ed25519",
								privateKey:
									"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
								publicKey: "v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
							}
						]
					}
				}
			),
			vaultSecretEntityStorageConnector
		});

		const verified = await vaultConnector.verify(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_KEY_NAME,
			new Uint8Array([1, 2, 3, 4, 5]),
			Converter.base64ToBytes(
				"xYHh6iMIUHWdAUcgj6ZiAVtpwl03k730MhupevDePA3OrDZ+8GsoVoOC+0MGSm75C1m6cnE9AlTHRcMWnN7rBQ=="
			)
		);

		expect(verified).toEqual(true);
	});

	test("can fail to encrypt with a key with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.encrypt(
				undefined as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to encrypt with a key with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.encrypt(
				{} as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to encrypt with a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.encrypt(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array
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

	test("can fail to encrypt with a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.encrypt(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.encrypt(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.encrypt(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				"ChaCha20Poly1305",
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.encrypt(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				"ChaCha20Poly1305",
				new Uint8Array()
			)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can encrypt with a key", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector: new MemoryEntityStorageConnector<IVaultKey>(
				VaultKeyDescriptor,
				{
					initialValues: {
						[TEST_TENANT_ID]: [
							{
								id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
								type: "Ed25519",
								privateKey:
									"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
								publicKey: "v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
							}
						]
					}
				}
			),
			vaultSecretEntityStorageConnector
		});

		const encrypted = await vaultConnector.encrypt(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_KEY_NAME,
			"ChaCha20Poly1305",
			new Uint8Array([1, 2, 3, 4, 5])
		);

		expect(encrypted.length).toEqual(17);
	});

	test("can fail to decrypt with a key with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.decrypt(
				undefined as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to decrypt with a key with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.decrypt(
				{} as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to decrypt with a key with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.decrypt(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as VaultEncryptionType,
				undefined as unknown as Uint8Array
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

	test("can fail to decrypt with a key with no key name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.decrypt(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.decrypt(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.decrypt(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				"ChaCha20Poly1305",
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
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.decrypt(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_KEY_NAME,
				"ChaCha20Poly1305",
				new Uint8Array()
			)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_KEY_NAME
			}
		});
	});

	test("can decrypt with a key", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector: new MemoryEntityStorageConnector<IVaultKey>(
				VaultKeyDescriptor,
				{
					initialValues: {
						[TEST_TENANT_ID]: [
							{
								id: `${TEST_IDENTITY_ID}/${TEST_KEY_NAME}`,
								type: "Ed25519",
								privateKey:
									"q61H8fLd9KjrFUOPvr0mEahicyBULexUvE3IA/pBuL2//coUiJ6//lz9Oo+L2XKPttxDQ3nsUGckE4TodvYKVQ==",
								publicKey: "v/3KFIiev/5c/TqPi9lyj7bcQ0N57FBnJBOE6Hb2ClU="
							}
						]
					}
				}
			),
			vaultSecretEntityStorageConnector
		});

		const decrypted = await vaultConnector.decrypt(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_KEY_NAME,
			"ChaCha20Poly1305",
			Converter.base64ToBytes("pqyhvnpz5alSH/C7sgPIvkQ=")
		);

		expect(decrypted).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
	});

	test("can fail to store a secret with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.setSecret(
				undefined as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to store a secret with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.setSecret(
				{} as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as Uint8Array
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to store a secret with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.setSecret(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string,
				undefined as unknown as Uint8Array
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

	test("can fail to store a secret with no secret name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.setSecret(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				undefined as unknown as string,
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

	test("can store a secret", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await vaultConnector.setSecret(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_SECRET_NAME,
			{ foo: "bar" }
		);

		const store = vaultSecretEntityStorageConnector.getStore(TEST_TENANT_ID);

		expect(store?.[0].id).toEqual(`${TEST_IDENTITY_ID}/${TEST_SECRET_NAME}`);
		expect(store?.[0].data).toEqual(JSON.stringify({ foo: "bar" }));
	});

	test("can fail to get a secret with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.getSecret(
				undefined as unknown as IRequestContext,
				undefined as unknown as string
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to get a secret with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.getSecret({} as unknown as IRequestContext, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to get a secret with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.getSecret(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string
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

	test("can fail to get a secret with no secret name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.getSecret(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				undefined as unknown as string
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

	test("can fail to get a secret that does not exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.getSecret(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_SECRET_NAME
			)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_SECRET_NAME
			}
		});
	});

	test("can get a secret", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector: new MemoryEntityStorageConnector<IVaultSecret>(
				VaultSecretDescriptor,
				{
					initialValues: {
						[TEST_TENANT_ID]: [
							{
								id: `${TEST_IDENTITY_ID}/${TEST_SECRET_NAME}`,
								data: JSON.stringify({ foo: "bar" })
							}
						]
					}
				}
			)
		});

		const secret = await vaultConnector.getSecret(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_SECRET_NAME
		);

		expect(secret).toEqual({ foo: "bar" });
	});

	test("can fail to remove a secret with no request context", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.removeSecret(
				undefined as unknown as IRequestContext,
				undefined as unknown as string
			)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to remove a secret with no tenant id", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.removeSecret({} as unknown as IRequestContext, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to remove a secret with no identity", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.removeSecret(
				{ tenantId: TEST_TENANT_ID } as unknown as IRequestContext,
				undefined as unknown as string
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

	test("can fail to remove a secret with no secret name", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.removeSecret(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				undefined as unknown as string
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

	test("can fail to remove a secret that does not exist", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector
		});

		await expect(
			vaultConnector.removeSecret(
				{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
				TEST_SECRET_NAME
			)
		).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: TEST_SECRET_NAME
			}
		});
	});

	test("can remove a secret", async () => {
		const vaultConnector = new EntityStorageVaultConnector({
			vaultKeyEntityStorageConnector,
			vaultSecretEntityStorageConnector: new MemoryEntityStorageConnector<IVaultSecret>(
				VaultSecretDescriptor,
				{
					initialValues: {
						[TEST_TENANT_ID]: [
							{
								id: `${TEST_IDENTITY_ID}/${TEST_SECRET_NAME}`,
								data: JSON.stringify({ foo: "bar" })
							}
						]
					}
				}
			)
		});

		await vaultConnector.removeSecret(
			{ tenantId: TEST_TENANT_ID, identity: TEST_IDENTITY_ID },
			TEST_SECRET_NAME
		);

		const store = vaultSecretEntityStorageConnector.getStore(TEST_TENANT_ID);

		expect(store?.[0]).toBeUndefined();
	});
});
