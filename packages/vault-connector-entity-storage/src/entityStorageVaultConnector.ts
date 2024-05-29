// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { AlreadyExistsError, Converter, Guards, Is, NotFoundError, RandomHelper } from "@gtsc/core";
import { Bip39, ChaCha20Poly1305, Ed25519, Secp256k1 } from "@gtsc/crypto";
import type { IEntityStorageConnector } from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import { type IVaultConnector, VaultEncryptionType, VaultKeyType } from "@gtsc/vault-models";
import type { VaultKey } from "./entities/vaultKey";
import type { VaultSecret } from "./entities/vaultSecret";

/**
 * Class for performing vault operations in entity storage.
 */
export class EntityStorageVaultConnector implements IVaultConnector {
	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<EntityStorageVaultConnector>();

	/**
	 * The entity storage for the vault keys.
	 * @internal
	 */
	private readonly _vaultKeyEntityStorageConnector: IEntityStorageConnector<VaultKey>;

	/**
	 * The entity storage for the vault secrets.
	 * @internal
	 */
	private readonly _vaultSecretEntityStorageConnector: IEntityStorageConnector<VaultSecret>;

	/**
	 * Create a new instance of EntityStorageVaultConnector.
	 * @param dependencies The dependencies for the logging connector.
	 * @param dependencies.vaultKeyEntityStorageConnector The vault key entity storage connector dependency.
	 * @param dependencies.vaultSecretEntityStorageConnector The vault secret entity storage connector dependency.
	 */
	constructor(dependencies: {
		vaultKeyEntityStorageConnector: IEntityStorageConnector<VaultKey>;
		vaultSecretEntityStorageConnector: IEntityStorageConnector<VaultSecret>;
	}) {
		Guards.object(EntityStorageVaultConnector._CLASS_NAME, nameof(dependencies), dependencies);
		Guards.object<IEntityStorageConnector<VaultKey>>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(dependencies.vaultKeyEntityStorageConnector),
			dependencies.vaultKeyEntityStorageConnector
		);
		Guards.object<IEntityStorageConnector<VaultSecret>>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(dependencies.vaultSecretEntityStorageConnector),
			dependencies.vaultSecretEntityStorageConnector
		);
		this._vaultKeyEntityStorageConnector = dependencies.vaultKeyEntityStorageConnector;
		this._vaultSecretEntityStorageConnector = dependencies.vaultSecretEntityStorageConnector;
	}

	/**
	 * Create a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to create in the vault.
	 * @param type The type of key to create.
	 * @returns The public key for the key pair.
	 */
	public async createKey(
		requestContext: IRequestContext,
		name: string,
		type: VaultKeyType
	): Promise<Uint8Array> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(type),
			type,
			Object.values(VaultKeyType)
		);

		const existingVaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);
		if (!Is.empty(existingVaultKey)) {
			throw new AlreadyExistsError(
				EntityStorageVaultConnector._CLASS_NAME,
				"keyAlreadyExists",
				name
			);
		}

		const mnemonic = Bip39.randomMnemonic();
		const seed = Bip39.mnemonicToSeed(mnemonic);

		let privateKey: Uint8Array;
		let publicKey: Uint8Array;

		if (type === VaultKeyType.Ed25519) {
			privateKey = seed.slice(0, Ed25519.PRIVATE_KEY_SIZE);
			publicKey = Ed25519.publicKeyFromPrivateKey(privateKey);
		} else {
			privateKey = seed.slice(0, Secp256k1.PRIVATE_KEY_SIZE);
			publicKey = Secp256k1.publicKeyFromPrivateKey(privateKey);
		}

		const vaultKey: VaultKey = {
			id: `${requestContext.identity}/${name}`,
			type,
			privateKey: Converter.bytesToBase64(privateKey),
			publicKey: Converter.bytesToBase64(publicKey)
		};

		await this._vaultKeyEntityStorageConnector.set(requestContext, vaultKey);

		return publicKey;
	}

	/**
	 * Add a key to the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to add to the vault.
	 * @param type The type of key to add.
	 * @param privateKey The private key.
	 * @param publicKey The public key.
	 * @returns Nothing.
	 */
	public async addKey(
		requestContext: IRequestContext,
		name: string,
		type: VaultKeyType,
		privateKey: Uint8Array,
		publicKey: Uint8Array
	): Promise<void> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(type),
			type,
			Object.values(VaultKeyType)
		);
		Guards.uint8Array(EntityStorageVaultConnector._CLASS_NAME, nameof(privateKey), privateKey);
		Guards.uint8Array(EntityStorageVaultConnector._CLASS_NAME, nameof(publicKey), publicKey);

		const existingVaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);
		if (!Is.empty(existingVaultKey)) {
			throw new AlreadyExistsError(
				EntityStorageVaultConnector._CLASS_NAME,
				"keyAlreadyExists",
				name
			);
		}

		const vaultKey: VaultKey = {
			id: `${requestContext.identity}/${name}`,
			type,
			privateKey: Converter.bytesToBase64(privateKey),
			publicKey: Converter.bytesToBase64(publicKey)
		};

		await this._vaultKeyEntityStorageConnector.set(requestContext, vaultKey);
	}

	/**
	 * Get a key from the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to get from the vault.
	 * @returns The key.
	 */
	public async getKey(
		requestContext: IRequestContext,
		name: string
	): Promise<{
		/**
		 * The type of the key e.g. Ed25519, Secp256k1.
		 */
		type: VaultKeyType;

		/**
		 * The private key.
		 */
		privateKey: Uint8Array;

		/**
		 * The public key.
		 */
		publicKey: Uint8Array;
	}> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", name);
		}

		return {
			type: vaultKey.type,
			privateKey: Converter.base64ToBytes(vaultKey.privateKey),
			publicKey: Converter.base64ToBytes(vaultKey.publicKey)
		};
	}

	/**
	 * Rename a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to rename.
	 * @param newName The new name of the key.
	 * @returns Nothing.
	 */
	public async renameKey(
		requestContext: IRequestContext,
		name: string,
		newName: string
	): Promise<void> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(newName), newName);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", name);
		}

		await this._vaultKeyEntityStorageConnector.remove(
			requestContext,
			`${requestContext.identity}/${name}`
		);

		vaultKey.id = `${requestContext.identity}/${newName}`;

		await this._vaultKeyEntityStorageConnector.set(requestContext, vaultKey);
	}

	/**
	 * Remove a key from the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to create in the value.
	 * @returns Nothing.
	 */
	public async removeKey(requestContext: IRequestContext, name: string): Promise<void> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", name);
		}

		await this._vaultKeyEntityStorageConnector.remove(
			requestContext,
			`${requestContext.identity}/${name}`
		);
	}

	/**
	 * Sign the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to use for signing.
	 * @param data The data to sign.
	 * @returns The signature for the data.
	 */
	public async sign(
		requestContext: IRequestContext,
		name: string,
		data: Uint8Array
	): Promise<Uint8Array> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);
		Guards.uint8Array(EntityStorageVaultConnector._CLASS_NAME, nameof(data), data);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", name);
		}

		let signatureBytes;
		const privateKeyBytes = Converter.base64ToBytes(vaultKey.privateKey);
		if (vaultKey.type === VaultKeyType.Ed25519) {
			signatureBytes = Ed25519.sign(privateKeyBytes, data);
		} else {
			signatureBytes = Secp256k1.sign(privateKeyBytes, data);
		}

		return signatureBytes;
	}

	/**
	 * Verify the signature of the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to use for verification.
	 * @param data The data that was signed in base64.
	 * @param signature The signature to verify in base64.
	 * @returns True if the verification is successful.
	 */
	public async verify(
		requestContext: IRequestContext,
		name: string,
		data: Uint8Array,
		signature: Uint8Array
	): Promise<boolean> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);
		Guards.uint8Array(EntityStorageVaultConnector._CLASS_NAME, nameof(data), data);
		Guards.uint8Array(EntityStorageVaultConnector._CLASS_NAME, nameof(signature), signature);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", name);
		}

		const publicKeyBytes = Converter.base64ToBytes(vaultKey.publicKey);

		if (vaultKey.type === VaultKeyType.Ed25519) {
			return Ed25519.verify(publicKeyBytes, data, signature);
		}
		return Secp256k1.verify(publicKeyBytes, data, signature);
	}

	/**
	 * Encrypt the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to use for encryption.
	 * @param encryptionType The type of encryption to use.
	 * @param data The data to encrypt in base64.
	 * @returns The encrypted data in base64.
	 */
	public async encrypt(
		requestContext: IRequestContext,
		name: string,
		encryptionType: VaultEncryptionType,
		data: Uint8Array
	): Promise<Uint8Array> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(encryptionType),
			encryptionType,
			Object.values(VaultEncryptionType)
		);
		Guards.uint8Array(EntityStorageVaultConnector._CLASS_NAME, nameof(data), data);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", name);
		}

		const privateKey = Converter.base64ToBytes(vaultKey.privateKey);

		const nonce = RandomHelper.generate(12);

		const cipher = new ChaCha20Poly1305(privateKey, nonce);
		const payload = cipher.encrypt(data);

		const encryptedBytes = new Uint8Array(nonce.length + payload.length);
		encryptedBytes.set(nonce);
		encryptedBytes.set(payload, nonce.length);

		return encryptedBytes;
	}

	/**
	 * Decrypt the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to use for decryption.
	 * @param encryptionType The type of encryption to use.
	 * @param encryptedData The data to decrypt in base64.
	 * @returns The decrypted data in base64.
	 */
	public async decrypt(
		requestContext: IRequestContext,
		name: string,
		encryptionType: VaultEncryptionType,
		encryptedData: Uint8Array
	): Promise<Uint8Array> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(encryptionType),
			encryptionType,
			Object.values(VaultEncryptionType)
		);
		Guards.uint8Array(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(encryptedData),
			encryptedData
		);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", name);
		}

		const privateKey = Converter.base64ToBytes(vaultKey.privateKey);

		const nonce = encryptedData.slice(0, 12);

		const cipher = new ChaCha20Poly1305(privateKey, nonce);
		const decryptedBytes = cipher.decrypt(encryptedData.slice(nonce.length));

		return decryptedBytes;
	}

	/**
	 * Store a secret in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the item in the vault to set.
	 * @param item The item to add to the vault.
	 * @returns Nothing.
	 */
	public async setSecret<T>(requestContext: IRequestContext, name: string, item: T): Promise<void> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);

		const vaultSecret: VaultSecret = {
			id: `${requestContext.identity}/${name}`,
			data: JSON.stringify(item)
		};

		await this._vaultSecretEntityStorageConnector.set(requestContext, vaultSecret);
	}

	/**
	 * Get a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the item in the vault to get.
	 * @returns The item from the vault.
	 * @throws Error if the item is not found.
	 */
	public async getSecret<T>(requestContext: IRequestContext, name: string): Promise<T> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);

		const secret = await this._vaultSecretEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);

		if (Is.empty(secret)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "secretNotFound", name);
		}

		return JSON.parse(secret.data);
	}

	/**
	 * Remove a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the item in the vault to remove.
	 * @returns Nothing.
	 * @throws Error if the item is not found.
	 */
	public async removeSecret(requestContext: IRequestContext, name: string): Promise<void> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageVaultConnector._CLASS_NAME, nameof(name), name);

		const secret = await this._vaultSecretEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${name}`
		);

		if (Is.empty(secret)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "secretNotFound", name);
		}

		return this._vaultSecretEntityStorageConnector.remove(
			requestContext,
			`${requestContext.identity}/${name}`
		);
	}
}
