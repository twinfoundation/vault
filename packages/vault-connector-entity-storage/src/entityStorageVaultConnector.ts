// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { AlreadyExistsError, Converter, Guards, Is, NotFoundError, RandomHelper } from "@gtsc/core";
import { Bip39, ChaCha20Poly1305, Ed25519 } from "@gtsc/crypto";
import type { IEntityStorageConnector } from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IVaultConnector, VaultKeyType, VaultEncryptionType } from "@gtsc/vault-models";
import type { IVaultKey } from "./models/IVaultKey";
import type { IVaultSecret } from "./models/IVaultSecret";

/**
 * Class for performing vault operations in memory.
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
	private readonly _vaultKeyEntityStorageConnector: IEntityStorageConnector<IVaultKey>;

	/**
	 * The entity storage for the vault secrets.
	 * @internal
	 */
	private readonly _vaultSecretEntityStorageConnector: IEntityStorageConnector<IVaultSecret>;

	/**
	 * Create a new instance of EntityStorageVaultConnector.
	 * @param dependencies The dependencies for the logging connector.
	 * @param dependencies.vaultKeyEntityStorageConnector The vault key entity storage connector dependency.
	 * @param dependencies.vaultSecretEntityStorageConnector The vault secret entity storage connector dependency.
	 */
	constructor(dependencies: {
		vaultKeyEntityStorageConnector: IEntityStorageConnector<IVaultKey>;
		vaultSecretEntityStorageConnector: IEntityStorageConnector<IVaultSecret>;
	}) {
		Guards.object(EntityStorageVaultConnector._CLASS_NAME, nameof(dependencies), dependencies);
		Guards.object(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(dependencies.vaultKeyEntityStorageConnector),
			dependencies.vaultKeyEntityStorageConnector
		);
		Guards.object(
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
	 * @param keyName The name of the key to create in the vault.
	 * @param keyType The type of key to create.
	 * @returns The public key for the key pair.
	 */
	public async createKey(
		requestContext: IRequestContext,
		keyName: string,
		keyType: VaultKeyType
	): Promise<Uint8Array> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.string(EntityStorageVaultConnector._CLASS_NAME, nameof(keyName), keyName);
		Guards.arrayOneOf<VaultKeyType>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(keyType),
			keyType,
			["Ed25519"]
		);

		const existingVaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${keyName}`
		);
		if (!Is.empty(existingVaultKey)) {
			throw new AlreadyExistsError(
				EntityStorageVaultConnector._CLASS_NAME,
				"keyAlreadyExists",
				keyName
			);
		}

		const mnemonic = Bip39.randomMnemonic();
		const seed = Bip39.mnemonicToSeed(mnemonic);
		const privateKey = Ed25519.privateKeyFromSeed(seed.slice(0, Ed25519.SEED_SIZE));
		const publicKey = Ed25519.publicKeyFromPrivateKey(privateKey);

		const vaultKey: IVaultKey = {
			id: `${requestContext.identity}/${keyName}`,
			type: keyType,
			privateKey: Converter.bytesToBase64(privateKey),
			publicKey: Converter.bytesToBase64(publicKey)
		};

		await this._vaultKeyEntityStorageConnector.set(requestContext, vaultKey);

		return publicKey;
	}

	/**
	 * Remove a key from the vault.
	 * @param requestContext The context for the request.
	 * @param keyName The name of the key to create in the value.
	 * @returns Nothing.
	 */
	public async removeKey(requestContext: IRequestContext, keyName: string): Promise<void> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.string(EntityStorageVaultConnector._CLASS_NAME, nameof(keyName), keyName);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${keyName}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", keyName);
		}

		await this._vaultKeyEntityStorageConnector.remove(
			requestContext,
			`${requestContext.identity}/${keyName}`
		);
	}

	/**
	 * Sign the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param keyName The name of the key to use for signing.
	 * @param data The data to sign.
	 * @returns The signature for the data.
	 */
	public async sign(
		requestContext: IRequestContext,
		keyName: string,
		data: Uint8Array
	): Promise<Uint8Array> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.string(EntityStorageVaultConnector._CLASS_NAME, nameof(keyName), keyName);
		Guards.uint8Array(EntityStorageVaultConnector._CLASS_NAME, nameof(data), data);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${keyName}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", keyName);
		}

		return Ed25519.sign(Converter.base64ToBytes(vaultKey.privateKey), data);
	}

	/**
	 * Verify the signature of the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param keyName The name of the key to use for verification.
	 * @param data The data that was signed.
	 * @param signature The signature to verify.
	 * @returns True if the verification is successful.
	 */
	public async verify(
		requestContext: IRequestContext,
		keyName: string,
		data: Uint8Array,
		signature: Uint8Array
	): Promise<boolean> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.string(EntityStorageVaultConnector._CLASS_NAME, nameof(keyName), keyName);
		Guards.uint8Array(EntityStorageVaultConnector._CLASS_NAME, nameof(data), data);
		Guards.uint8Array(EntityStorageVaultConnector._CLASS_NAME, nameof(signature), signature);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${keyName}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", keyName);
		}

		return Ed25519.verify(Converter.base64ToBytes(vaultKey.publicKey), data, signature);
	}

	/**
	 * Encrypt the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param keyName The name of the key to use for encryption.
	 * @param encryptionType The type of encryption to use.
	 * @param data The data to encrypt.
	 * @returns The encrypted data.
	 */
	public async encrypt(
		requestContext: IRequestContext,
		keyName: string,
		encryptionType: VaultEncryptionType,
		data: Uint8Array
	): Promise<Uint8Array> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.string(EntityStorageVaultConnector._CLASS_NAME, nameof(keyName), keyName);
		Guards.arrayOneOf<VaultEncryptionType>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(encryptionType),
			encryptionType,
			["ChaCha20Poly1305"]
		);
		Guards.uint8Array(EntityStorageVaultConnector._CLASS_NAME, nameof(data), data);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${keyName}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", keyName);
		}

		const privateKey = Converter.base64ToBytes(vaultKey.privateKey);

		const nonce = RandomHelper.generate(12);

		const cipher = ChaCha20Poly1305.encryptor(privateKey, nonce);
		const payload = cipher.update(data);

		const encryptedBytes = new Uint8Array(nonce.length + payload.length);
		encryptedBytes.set(nonce);
		encryptedBytes.set(payload, nonce.length);

		return encryptedBytes;
	}

	/**
	 * Decrypt the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param keyName The name of the key to use for decryption.
	 * @param encryptionType The type of encryption to use.
	 * @param encryptedData The data to decrypt.
	 * @returns The decrypted data.
	 */
	public async decrypt(
		requestContext: IRequestContext,
		keyName: string,
		encryptionType: VaultEncryptionType,
		encryptedData: Uint8Array
	): Promise<Uint8Array> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.string(EntityStorageVaultConnector._CLASS_NAME, nameof(keyName), keyName);
		Guards.arrayOneOf<VaultEncryptionType>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(encryptionType),
			encryptionType,
			["ChaCha20Poly1305"]
		);
		Guards.uint8Array(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(encryptedData),
			encryptedData
		);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${keyName}`
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(EntityStorageVaultConnector._CLASS_NAME, "keyNotFound", keyName);
		}

		const privateKey = Converter.base64ToBytes(vaultKey.privateKey);

		const nonce = encryptedData.slice(0, 12);

		const decipher = ChaCha20Poly1305.decryptor(privateKey, nonce);
		const decryptedBytes = decipher.update(encryptedData.slice(nonce.length));

		return decryptedBytes;
	}

	/**
	 * Store a secret in the vault.
	 * @param requestContext The context for the request.
	 * @param secretName The name of the item in the vault to set.
	 * @param item The item to add to the vault.
	 * @returns Nothing.
	 */
	public async setSecret<T>(
		requestContext: IRequestContext,
		secretName: string,
		item: T
	): Promise<void> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.string(EntityStorageVaultConnector._CLASS_NAME, nameof(secretName), secretName);

		const vaultSecret: IVaultSecret = {
			id: `${requestContext.identity}/${secretName}`,
			data: JSON.stringify(item)
		};

		await this._vaultSecretEntityStorageConnector.set(requestContext, vaultSecret);
	}

	/**
	 * Get a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param secretName The name of the item in the vault to get.
	 * @returns The item from the vault.
	 * @throws Error if the item is not found.
	 */
	public async getSecret<T>(requestContext: IRequestContext, secretName: string): Promise<T> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.string(EntityStorageVaultConnector._CLASS_NAME, nameof(secretName), secretName);

		const secret = await this._vaultSecretEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${secretName}`
		);

		if (Is.empty(secret)) {
			throw new NotFoundError(
				EntityStorageVaultConnector._CLASS_NAME,
				"secretNotFound",
				secretName
			);
		}

		return JSON.parse(secret.data);
	}

	/**
	 * Remove a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param secretName The name of the item in the vault to remove.
	 * @returns Nothing.
	 * @throws Error if the item is not found.
	 */
	public async removeSecret(requestContext: IRequestContext, secretName: string): Promise<void> {
		Guards.object<IRequestContext>(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.string(
			EntityStorageVaultConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.string(EntityStorageVaultConnector._CLASS_NAME, nameof(secretName), secretName);

		const secret = await this._vaultSecretEntityStorageConnector.get(
			requestContext,
			`${requestContext.identity}/${secretName}`
		);

		if (Is.empty(secret)) {
			throw new NotFoundError(
				EntityStorageVaultConnector._CLASS_NAME,
				"secretNotFound",
				secretName
			);
		}

		return this._vaultSecretEntityStorageConnector.remove(
			requestContext,
			`${requestContext.identity}/${secretName}`
		);
	}
}
