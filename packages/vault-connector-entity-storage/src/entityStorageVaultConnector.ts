// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { AlreadyExistsError, Converter, Guards, Is, NotFoundError, RandomHelper } from "@gtsc/core";
import { Bip39, ChaCha20Poly1305, Ed25519, Secp256k1 } from "@gtsc/crypto";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { IServiceRequestContext } from "@gtsc/services";
import { type IVaultConnector, VaultEncryptionType, VaultKeyType } from "@gtsc/vault-models";
import type { VaultKey } from "./entities/vaultKey";
import type { VaultSecret } from "./entities/vaultSecret";

/**
 * Class for performing vault operations in entity storage.
 */
export class EntityStorageVaultConnector implements IVaultConnector {
	/**
	 * The namespace supported by the vault connector.
	 */
	public static readonly NAMESPACE: string = "entity-storage";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<EntityStorageVaultConnector>();

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
	 * @param options The options for the connector.
	 * @param options.vaultKeyEntityStorageType The vault key entity storage connector type, defaults to "vault-key".
	 * @param options.vaultSecretEntityStorageType The vault secret entity storage connector type, defaults to "vault-secret".
	 */
	constructor(options?: {
		vaultKeyEntityStorageType?: string;
		vaultSecretEntityStorageType?: string;
	}) {
		this._vaultKeyEntityStorageConnector = EntityStorageConnectorFactory.get(
			options?.vaultKeyEntityStorageType ?? "vault-key"
		);
		this._vaultSecretEntityStorageConnector = EntityStorageConnectorFactory.get(
			options?.vaultSecretEntityStorageType ?? "vault-secret"
		);
	}

	/**
	 * Create a key in the vault.
	 * @param name The name of the key to create in the vault.
	 * @param type The type of key to create.
	 * @param requestContext The context for the request.
	 * @returns The public key for the key pair.
	 */
	public async createKey(
		name: string,
		type: VaultKeyType,
		requestContext?: IServiceRequestContext
	): Promise<Uint8Array> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf<VaultKeyType>(
			this.CLASS_NAME,
			nameof(type),
			type,
			Object.values(VaultKeyType)
		);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const existingVaultKey = await this._vaultKeyEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);
		if (!Is.empty(existingVaultKey)) {
			throw new AlreadyExistsError(this.CLASS_NAME, "keyAlreadyExists", name);
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
			id: `${requestContext.userIdentity}/${name}`,
			type,
			privateKey: Converter.bytesToBase64(privateKey),
			publicKey: Converter.bytesToBase64(publicKey)
		};

		await this._vaultKeyEntityStorageConnector.set(vaultKey, requestContext);

		return publicKey;
	}

	/**
	 * Add a key to the vault.
	 * @param name The name of the key to add to the vault.
	 * @param type The type of key to add.
	 * @param privateKey The private key.
	 * @param publicKey The public key.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	public async addKey(
		name: string,
		type: VaultKeyType,
		privateKey: Uint8Array,
		publicKey: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf<VaultKeyType>(
			this.CLASS_NAME,
			nameof(type),
			type,
			Object.values(VaultKeyType)
		);
		Guards.uint8Array(this.CLASS_NAME, nameof(privateKey), privateKey);
		Guards.uint8Array(this.CLASS_NAME, nameof(publicKey), publicKey);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const existingVaultKey = await this._vaultKeyEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);
		if (!Is.empty(existingVaultKey)) {
			throw new AlreadyExistsError(this.CLASS_NAME, "keyAlreadyExists", name);
		}

		const vaultKey: VaultKey = {
			id: `${requestContext.userIdentity}/${name}`,
			type,
			privateKey: Converter.bytesToBase64(privateKey),
			publicKey: Converter.bytesToBase64(publicKey)
		};

		await this._vaultKeyEntityStorageConnector.set(vaultKey, requestContext);
	}

	/**
	 * Get a key from the vault.
	 * @param name The name of the key to get from the vault.
	 * @param requestContext The context for the request.
	 * @returns The key.
	 */
	public async getKey(
		name: string,
		requestContext?: IServiceRequestContext
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
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name);
		}

		return {
			type: vaultKey.type,
			privateKey: Converter.base64ToBytes(vaultKey.privateKey),
			publicKey: Converter.base64ToBytes(vaultKey.publicKey)
		};
	}

	/**
	 * Rename a key in the vault.
	 * @param name The name of the key to rename.
	 * @param newName The new name of the key.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	public async renameKey(
		name: string,
		newName: string,
		requestContext?: IServiceRequestContext
	): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.stringValue(this.CLASS_NAME, nameof(newName), newName);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name);
		}

		await this._vaultKeyEntityStorageConnector.remove(
			`${requestContext.userIdentity}/${name}`,
			requestContext
		);

		vaultKey.id = `${requestContext.userIdentity}/${newName}`;

		await this._vaultKeyEntityStorageConnector.set(vaultKey, requestContext);
	}

	/**
	 * Remove a key from the vault.
	 * @param name The name of the key to create in the value.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	public async removeKey(name: string, requestContext?: IServiceRequestContext): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name);
		}

		await this._vaultKeyEntityStorageConnector.remove(
			`${requestContext.userIdentity}/${name}`,
			requestContext
		);
	}

	/**
	 * Sign the data using a key in the vault.
	 * @param name The name of the key to use for signing.
	 * @param data The data to sign.
	 * @param requestContext The context for the request.
	 * @returns The signature for the data.
	 */
	public async sign(
		name: string,
		data: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<Uint8Array> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name);
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
	 * @param name The name of the key to use for verification.
	 * @param data The data that was signed in base64.
	 * @param signature The signature to verify in base64.
	 * @param requestContext The context for the request.
	 * @returns True if the verification is successful.
	 */
	public async verify(
		name: string,
		data: Uint8Array,
		signature: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<boolean> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);
		Guards.uint8Array(this.CLASS_NAME, nameof(signature), signature);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name);
		}

		const publicKeyBytes = Converter.base64ToBytes(vaultKey.publicKey);

		if (vaultKey.type === VaultKeyType.Ed25519) {
			return Ed25519.verify(publicKeyBytes, data, signature);
		}
		return Secp256k1.verify(publicKeyBytes, data, signature);
	}

	/**
	 * Encrypt the data using a key in the vault.
	 * @param name The name of the key to use for encryption.
	 * @param encryptionType The type of encryption to use.
	 * @param data The data to encrypt in base64.
	 * @param requestContext The context for the request.
	 * @returns The encrypted data in base64.
	 */
	public async encrypt(
		name: string,
		encryptionType: VaultEncryptionType,
		data: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<Uint8Array> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf<VaultEncryptionType>(
			this.CLASS_NAME,
			nameof(encryptionType),
			encryptionType,
			Object.values(VaultEncryptionType)
		);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name);
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
	 * @param name The name of the key to use for decryption.
	 * @param encryptionType The type of encryption to use.
	 * @param encryptedData The data to decrypt in base64.
	 * @param requestContext The context for the request.
	 * @returns The decrypted data in base64.
	 */
	public async decrypt(
		name: string,
		encryptionType: VaultEncryptionType,
		encryptedData: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<Uint8Array> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf<VaultEncryptionType>(
			this.CLASS_NAME,
			nameof(encryptionType),
			encryptionType,
			Object.values(VaultEncryptionType)
		);
		Guards.uint8Array(this.CLASS_NAME, nameof(encryptedData), encryptedData);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const vaultKey = await this._vaultKeyEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);
		if (Is.empty(vaultKey)) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name);
		}

		const privateKey = Converter.base64ToBytes(vaultKey.privateKey);

		const nonce = encryptedData.slice(0, 12);

		const cipher = new ChaCha20Poly1305(privateKey, nonce);
		const decryptedBytes = cipher.decrypt(encryptedData.slice(nonce.length));

		return decryptedBytes;
	}

	/**
	 * Store a secret in the vault.
	 * @param name The name of the item in the vault to set.
	 * @param item The item to add to the vault.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	public async setSecret<T>(
		name: string,
		item: T,
		requestContext?: IServiceRequestContext
	): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.defined(this.CLASS_NAME, nameof(item), item);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const vaultSecret: VaultSecret = {
			id: `${requestContext.userIdentity}/${name}`,
			data: JSON.stringify(item)
		};

		await this._vaultSecretEntityStorageConnector.set(vaultSecret, requestContext);
	}

	/**
	 * Get a secret from the vault.
	 * @param name The name of the item in the vault to get.
	 * @param requestContext The context for the request.
	 * @returns The item from the vault.
	 * @throws Error if the item is not found.
	 */
	public async getSecret<T>(name: string, requestContext?: IServiceRequestContext): Promise<T> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const secret = await this._vaultSecretEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);

		if (Is.empty(secret)) {
			throw new NotFoundError(this.CLASS_NAME, "secretNotFound", name);
		}

		return JSON.parse(secret.data);
	}

	/**
	 * Remove a secret from the vault.
	 * @param name The name of the item in the vault to remove.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 * @throws Error if the item is not found.
	 */
	public async removeSecret(name: string, requestContext?: IServiceRequestContext): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.userIdentity),
			requestContext?.userIdentity
		);

		const secret = await this._vaultSecretEntityStorageConnector.get(
			`${requestContext.userIdentity}/${name}`,
			undefined,
			requestContext
		);

		if (Is.empty(secret)) {
			throw new NotFoundError(this.CLASS_NAME, "secretNotFound", name);
		}

		return this._vaultSecretEntityStorageConnector.remove(
			`${requestContext.userIdentity}/${name}`,
			requestContext
		);
	}
}
