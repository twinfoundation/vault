// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	AlreadyExistsError,
	BaseError,
	Converter,
	GeneralError,
	Guards,
	NotFoundError,
	NotSupportedError
} from "@twin.org/core";
import { LoggingConnectorFactory } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import { type IVaultConnector, VaultEncryptionType, VaultKeyType } from "@twin.org/vault-models";
import { FetchError, FetchHelper, HttpMethod, type IHttpHeaders } from "@twin.org/web";
import type { IBackupKeyResponse } from "./models/IBackupKeyResponse";
import type { ICreateKeyRequest } from "./models/ICreateKeyRequest";
import type { IDecryptDataRequest } from "./models/IDecryptDataRequest";
import type { IDecryptDataResponse } from "./models/IDecryptDataResponse";
import type { IEncryptDataRequest } from "./models/IEncryptDataRequest";
import type { IEncryptDataResponse } from "./models/IEncryptDataResponse";
import type { IExportPrivateKeyResponse } from "./models/IExportPrivateKeyResponse";
import type { IGetPublicKeyResponse } from "./models/IGetPublicKeyResponse";
import type { IHashicorpVaultConnectorConfig } from "./models/IHashicorpVaultConnectorConfig";
import type { IHashicorpVaultRequest } from "./models/IHashicorpVaultRequest";
import type { IHashicorpVaultResponse } from "./models/IHashicorpVaultResponse";
import type { IKeyDeleteConfigResponse } from "./models/IKeyDeleteConfigResponse";
import type { IReadKeyResponse } from "./models/IReadKeyResponse";
import type { IRestoreKeyRequest } from "./models/IRestoreKeyRequest";
import type { ISecretData } from "./models/ISecretData";
import type { ISecretVersionResponse } from "./models/ISecretVersionResponse";
import type { ISignDataRequest } from "./models/ISignDataRequest";
import type { ISignDataResponse } from "./models/ISignDataResponse";
import type { IUpdateKeyConfigRequest } from "./models/IUpdateKeyConfigRequest";
import type { IVerifyDataRequest } from "./models/IVerifyDataRequest";
import type { IVerifyDataResponse } from "./models/IVerifyDataResponse";

/**
 * Class for performing vault operations in entity storage.
 */
export class HashicorpVaultConnector implements IVaultConnector {
	/**
	 * The namespace supported by the vault connector.
	 */
	public static readonly NAMESPACE: string = "hashicorp-storage";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<HashicorpVaultConnector>();

	/**
	 * The entity storage for the vault keys.
	 * @internal
	 */
	private readonly _config: IHashicorpVaultConnectorConfig;

	/**
	 * The KV mount path.
	 * @internal
	 */
	private readonly _kvMountPath: string;

	/**
	 * The transit mount path.
	 * @internal
	 */
	private readonly _transitMountPath: string;

	/**
	 * The base URL for the Vault API.
	 * @internal
	 */
	private readonly _baseUrl: string;

	/**
	 * The headers for the requests.
	 * @internal
	 */
	private readonly _headers: IHttpHeaders;

	/**
	 * Create a new instance of HashicorpStorageVaultConnector.
	 * @param options The options for the vault connector.
	 * @param options.config The configuration for the Hashicorp Vault connector.
	 */
	constructor(options: { config: IHashicorpVaultConnectorConfig }) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IHashicorpVaultConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.endpoint), options.config.endpoint);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.token), options.config.token);

		this._config = options.config;
		this._kvMountPath = this._config.kvMountPath ?? "secret";
		this._transitMountPath = this._config.transitMountPath ?? "transit";
		this._baseUrl = `${this._config.endpoint}/${this._config.apiVersion ?? "v1"}`;
		this._headers = {
			"X-Vault-Token": this._config.token
		};
	}

	/**
	 * Bootstrap the vault connector and ensure connectivity.
	 * @param nodeLoggingConnectorType The node logging connector type, defaults to "node-logging".
	 * @returns True if the bootstrapping process was successful.
	 */
	public async bootstrap(nodeLoggingConnectorType?: string): Promise<boolean> {
		const nodeLogging = LoggingConnectorFactory.getIfExists(
			nodeLoggingConnectorType ?? "node-logging"
		);

		try {
			await FetchHelper.fetch(
				this.CLASS_NAME,
				`${this._baseUrl}/sys/health`,
				HttpMethod.GET,
				undefined,
				{ headers: this._headers }
			);

			await nodeLogging?.log({
				level: "info",
				source: this.CLASS_NAME,
				ts: Date.now(),
				message: "hashicorpVaultConnected",
				data: {
					address: this._config.endpoint,
					token: this._config.token
				}
			});

			return true;
		} catch (err) {
			await nodeLogging?.log({
				level: "error",
				source: this.CLASS_NAME,
				ts: Date.now(),
				message: "hashicorpVaultConnectionFailed",
				error: BaseError.fromError(err),
				data: {
					address: this._config.endpoint,
					token: this._config.token
				}
			});
			return false;
		}
	}

	/**
	 * Store a secret in the vault.
	 * @param name The name of the item in the vault to set.
	 * @param data The item to add to the vault.
	 * @returns Nothing.
	 */
	public async setSecret<T>(name: string, data: T): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.defined(this.CLASS_NAME, nameof(data), data);

		try {
			const path = this.getSecretPath(name);
			const url = `${this._baseUrl}/${path}`;
			const payload = { data };

			await FetchHelper.fetchJson<IHashicorpVaultRequest<T>, unknown>(
				this.CLASS_NAME,
				url,
				HttpMethod.POST,
				payload,
				{
					headers: this._headers
				}
			);
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "setSecretFailed", { name }, err);
		}
	}

	/**
	 * Get a secret from the vault.
	 * @param name The name of the item in the vault to get.
	 * @returns The item from the vault.
	 * @throws Error if the item is not found.
	 */
	public async getSecret<T>(name: string): Promise<T> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);

		try {
			await this.getSecretVersions(name);
		} catch (err) {
			throw new NotFoundError(this.CLASS_NAME, "secretNotFound", name, err);
		}

		try {
			const path = this.getSecretPath(name);
			const url = `${this._baseUrl}/${path}`;

			const response = await FetchHelper.fetchJson<never, IHashicorpVaultResponse<ISecretData<T>>>(
				this.CLASS_NAME,
				url,
				HttpMethod.GET,
				undefined,
				{ headers: this._headers }
			);

			return response.data.data as T;
		} catch (err) {
			if (err instanceof FetchError && err.properties?.httpStatus === 404) {
				throw new NotFoundError(this.CLASS_NAME, "secretNotFound", name, err);
			}
			throw new GeneralError(this.CLASS_NAME, "setSecretFailed", { name }, err);
		}
	}

	/**
	 * Remove a secret from the vault.
	 * @param name The name of the item in the vault to remove.
	 * @returns Nothing.
	 * @throws Error if the item is not found.
	 */
	public async removeSecret(name: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);

		try {
			await this.getSecretVersions(name);
		} catch (err) {
			throw new NotFoundError(this.CLASS_NAME, "secretNotFound", name, err);
		}

		try {
			const path = this.getSecretMetadataPath(name);
			const url = `${this._baseUrl}/${path}`;

			await FetchHelper.fetchJson<never, IHashicorpVaultResponse<unknown>>(
				this.CLASS_NAME,
				url,
				HttpMethod.DELETE,
				undefined,
				{ headers: this._headers }
			);
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "removeSecretFailed", { name }, err);
		}
	}

	/**
	 * Create a key in the vault.
	 * @param name The name of the key to create.
	 * @param type The type of the key to create.
	 * @returns The private key.
	 */
	public async createKey(name: string, type: VaultKeyType): Promise<Uint8Array> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf<VaultKeyType>(
			this.CLASS_NAME,
			nameof(type),
			type,
			Object.values(VaultKeyType)
		);

		const path = this.getTransitKeyPath(name);
		const url = `${this._baseUrl}/${path}`;

		try {
			// Check if the key exists
			const existingVaultKey = await this.readKey(name);
			if (existingVaultKey) {
				throw new AlreadyExistsError(this.CLASS_NAME, "keyAlreadyExists", name);
			}
		} catch (err) {
			if (!(err instanceof FetchError && err.properties?.httpStatus === 404)) {
				throw err;
			}
		}

		try {
			const vaultKeyType = this.mapVaultKeyType(type);

			const payload = {
				type: vaultKeyType,
				exportable: true,
				allow_plaintext_backup: true // eslint-disable-line camelcase
			};

			await FetchHelper.fetchJson<ICreateKeyRequest, IHashicorpVaultResponse<unknown>>(
				this.CLASS_NAME,
				url,
				HttpMethod.POST,
				payload,
				{ headers: this._headers }
			);

			// If the key is asymmetric, return the public key
			if (this.isAsymmetricKeyType(type)) {
				const publicKey = await this.getPublicKey(name);
				return publicKey;
			}

			// If the key is symmetric, return the private key
			const symmetricKey = await this.backupKey(name);
			const privateKey = Converter.base64ToBytes(symmetricKey);
			return privateKey;
		} catch (err) {
			if (err instanceof AlreadyExistsError) {
				throw err;
			}
			throw new GeneralError(this.CLASS_NAME, "createdKeyFailed", { name, type }, err);
		}
	}

	/**
	 * Get the key configuration.
	 * @param name The name of the key to get the configuration for.
	 * @returns True if the key can be deleted.
	 */
	public async getKeyDeleteConfiguration(name: string): Promise<boolean> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		const path = this.getTransitKeyPath(name);
		const url = `${this._baseUrl}/${path}`;

		try {
			const response = await FetchHelper.fetchJson<
				never,
				IHashicorpVaultResponse<IKeyDeleteConfigResponse>
			>(this.CLASS_NAME, url, HttpMethod.GET, undefined, { headers: this._headers });

			return response.data.deletion_allowed;
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "getKeyDeleteConfigurationFailed", { name }, err);
		}
	}

	/**
	 * Add a key to the vault.
	 * @param name The name of the key to add.
	 * @param type The type of the key to add.
	 * @param privateKey The private key to add.
	 * @param publicKey The public key to add.
	 * @returns Nothing.
	 */
	public async addKey(
		name: string,
		type: VaultKeyType,
		privateKey: Uint8Array,
		publicKey: Uint8Array
	): Promise<void> {
		// Adding (asymmetric) keys is not supported by HashiCorp Vault's Transit Secrets Engine. Please generate keys within Vault. For more information, refer to HashiCorp's [Transit Secrets Engine Documentation](https://www.vaultproject.io/docs/secrets/transit).
		throw new NotSupportedError(this.CLASS_NAME, "addKeyNotSupported");
	}

	/**
	 * Get a key from the vault.
	 * @param name The name of the key to get.
	 * @returns The key.
	 */
	public async getKey(name: string): Promise<{
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

		try {
			await this.readKey(name);
		} catch (err) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name, err);
		}

		try {
			const publicKey = await this.getPublicKey(name);
			const privateKeyData = await this.exportPrivateKey(name);
			const type = privateKeyData.type;
			const privateKey = privateKeyData.privateKey;

			return {
				type,
				privateKey,
				publicKey
			};
		} catch (err) {
			if (err instanceof NotFoundError) {
				throw err;
			}
			throw new GeneralError(this.CLASS_NAME, "getKeyFailed", { name }, err);
		}
	}

	/**
	 * Rename a key in the vault.
	 * @param name The name of the key to rename.
	 * @param newName The new name of the key.
	 * @returns Nothing.
	 */
	public async renameKey(name: string, newName: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.stringValue(this.CLASS_NAME, nameof(newName), newName);

		try {
			const backup = await this.backupKey(name);
			await this.restoreKey(newName, backup);
			await this.removeKey(name);
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "renameKeyFailed", { name, newName }, err);
		}
	}

	/**
	 * Remove a key from the vault.
	 * @param name The name of the key to remove.
	 * @returns Nothing.
	 */
	public async removeKey(name: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);

		try {
			await this.readKey(name);
		} catch (err) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name, err);
		}

		try {
			const path = this.getTransitKeyPath(name);
			const url = `${this._baseUrl}/${path}`;

			await this.updateKeyConfig(name, true);

			await FetchHelper.fetch(this.CLASS_NAME, url, HttpMethod.DELETE, undefined, {
				headers: this._headers
			});
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "removeKeyFailed", { name }, err);
		}
	}

	/**
	 * Sign data.
	 * @param name The name of the key to use.
	 * @param data The data to sign.
	 * @returns The signature.
	 */
	public async sign(name: string, data: Uint8Array): Promise<Uint8Array> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		try {
			await this.readKey(name);
		} catch (err) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name, err);
		}

		try {
			const path = this.getTransitSignPath(name);
			const url = `${this._baseUrl}/${path}`;

			const base64Data = Converter.bytesToBase64(data);

			const payload = {
				input: base64Data
			};

			const response = await FetchHelper.fetchJson<
				ISignDataRequest,
				IHashicorpVaultResponse<ISignDataResponse>
			>(this.CLASS_NAME, url, HttpMethod.POST, payload, { headers: this._headers });

			if (response?.data?.signature) {
				const signatureString = response.data.signature;

				const prefix = "vault:v1:";
				const cleanedSignature = signatureString.startsWith(prefix)
					? signatureString.slice(prefix.length)
					: signatureString;

				const signatureBytes = Converter.base64ToBytes(cleanedSignature);
				return signatureBytes;
			}
			throw new GeneralError(this.CLASS_NAME, "invalidSignResponse", { name });
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "signDataFailed", { name }, err);
		}
	}

	/**
	 * Verify a signature.
	 * @param name The name of the key to use.
	 * @param data The data to verify.
	 * @param signature The signature to verify.
	 * @returns True if the signature is valid.
	 */
	public async verify(name: string, data: Uint8Array, signature: Uint8Array): Promise<boolean> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);
		Guards.uint8Array(this.CLASS_NAME, nameof(signature), signature);

		try {
			await this.readKey(name);
		} catch (err) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name, err);
		}

		try {
			const path = this.getTransitVerifyPath(name);
			const url = `${this._baseUrl}/${path}`;

			const base64Data = Converter.bytesToBase64(data);
			const signatureBase64 = Converter.bytesToBase64(signature);

			const prefix = "vault:v1:";
			const prefixedSignature = `${prefix}${signatureBase64}`;

			const payload = {
				input: base64Data,
				signature: prefixedSignature
			};

			const response = await FetchHelper.fetchJson<
				IVerifyDataRequest,
				IHashicorpVaultResponse<IVerifyDataResponse>
			>(this.CLASS_NAME, url, HttpMethod.POST, payload, { headers: this._headers });

			if (response?.data?.valid) {
				return response.data.valid;
			}

			return false;
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "verifyDataFailed", { name }, err);
		}
	}

	/**
	 * Encrypt data.
	 * @param name The name of the key to use.
	 * @param encryptionType The type of encryption to use.
	 * @param data The data to encrypt.
	 * @returns The encrypted data.
	 */
	public async encrypt(
		name: string,
		encryptionType: VaultEncryptionType,
		data: Uint8Array
	): Promise<Uint8Array> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf<VaultEncryptionType>(
			this.CLASS_NAME,
			nameof(encryptionType),
			encryptionType,
			Object.values(VaultEncryptionType)
		);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		try {
			await this.readKey(name);
		} catch (err) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name, err);
		}

		try {
			const path = this.getTransitEncryptPath(name);
			const url = `${this._baseUrl}/${path}`;

			const base64ata = Converter.bytesToBase64(data);

			const payload = {
				plaintext: base64ata
			};

			const response = await FetchHelper.fetchJson<
				IEncryptDataRequest,
				IHashicorpVaultResponse<IEncryptDataResponse>
			>(this.CLASS_NAME, url, HttpMethod.POST, payload, { headers: this._headers });

			if (response?.data?.ciphertext) {
				const { ciphertext } = response.data;
				return Converter.utf8ToBytes(ciphertext);
			}
			throw new GeneralError(this.CLASS_NAME, "invalidEncryptResponse", { name, encryptionType });
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "encryptDataFailed", { name, encryptionType }, err);
		}
	}

	/**
	 * Decrypt data.
	 * @param name The name of the key to use.
	 * @param encryptionType The type of encryption to use.
	 * @param encryptedData The encrypted data to decrypt.
	 * @returns The decrypted data.
	 */
	public async decrypt(
		name: string,
		encryptionType: VaultEncryptionType,
		encryptedData: Uint8Array
	): Promise<Uint8Array> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.arrayOneOf<VaultEncryptionType>(
			this.CLASS_NAME,
			nameof(encryptionType),
			encryptionType,
			Object.values(VaultEncryptionType)
		);
		Guards.uint8Array(this.CLASS_NAME, nameof(encryptedData), encryptedData);

		try {
			await this.readKey(name);
		} catch (err) {
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name, err);
		}

		try {
			const path = this.getTransitDecryptPath(name);
			const url = `${this._baseUrl}/${path}`;

			const ciphertext = Converter.bytesToUtf8(encryptedData);

			const payload = {
				ciphertext
			};

			const response = await FetchHelper.fetchJson<
				IDecryptDataRequest,
				IHashicorpVaultResponse<IDecryptDataResponse>
			>(this.CLASS_NAME, url, HttpMethod.POST, payload, { headers: this._headers });

			if (response?.data?.plaintext) {
				const { plaintext } = response.data;
				return Converter.base64ToBytes(plaintext);
			}
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "decryptDataFailed", { name, encryptionType }, err);
		}
		return new Uint8Array();
	}

	/**
	 * Get the versions of a secret.
	 * @param name The name of the secret.
	 * @returns The versions of the secret.
	 * @throws Error if the secret is not found.
	 */
	public async getSecretVersions(name: string): Promise<number[]> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);

		try {
			const versions = await this.fetchSecretVersions(name);
			return versions;
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "getSecretVersionsFailed", { name }, err);
		}
	}

	/**
	 * Update the configuration of a key.
	 * @param name The name of the key to update.
	 * @param deletionAllowed Whether the key can be deleted.
	 * @param exportable Whether the key can be exported.
	 * @returns Nothing.
	 */
	public async updateKeyConfig(
		name: string,
		deletionAllowed?: boolean,
		exportable?: boolean
	): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);

		try {
			const path = this.getTransitKeyConfigPath(name);
			const url = `${this._baseUrl}/${path}`;

			const payload = {
				deletion_allowed: deletionAllowed, // eslint-disable-line camelcase
				exportable
			};

			await FetchHelper.fetchJson<IUpdateKeyConfigRequest, IHashicorpVaultResponse<unknown>>(
				this.CLASS_NAME,
				url,
				HttpMethod.POST,
				payload,
				{ headers: this._headers }
			);
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "updateKeyConfigFailed", { name }, err);
		}
	}

	/**
	 * Export the public key from the vault.
	 * @param name The name of the key.
	 * @param version The version of the key. If omitted, the latest version of the key will be returned.
	 * @returns The public key as a Uint8Array.
	 * @throws Error if the key cannot be exported or found.
	 */
	public async getPublicKey(name: string, version?: string): Promise<Uint8Array> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		const versionPath = version ? `${version}` : "latest";

		const path = this.getTransitExportKeyPath(name, "public-key");
		const url = `${this._baseUrl}/${path}/${versionPath}`;

		try {
			const response = await FetchHelper.fetchJson<
				never,
				IHashicorpVaultResponse<IGetPublicKeyResponse>
			>(this.CLASS_NAME, url, HttpMethod.GET, undefined, { headers: this._headers });

			const { keys } = response.data;

			if (keys && Object.keys(keys).length > 0) {
				const keyVersion = Object.keys(keys)[0];
				const publicKeyBase64 = keys[keyVersion];
				return Converter.base64ToBytes(publicKeyBase64);
			}

			throw new NotFoundError(this.CLASS_NAME, "publicKeyNotFound", name);
		} catch (err) {
			if (err instanceof FetchError) {
				throw err;
			}
			throw new GeneralError(this.CLASS_NAME, "exportPublicKeyFailed", { name }, err);
		}
	}

	/**
	 * Backup a key from the vault.
	 * @param name The name of the key to backup.
	 * @returns The private key as a Uint8Array.
	 * @throws Error if the key cannot be exported or found.
	 */
	public async backupKey(name: string): Promise<string> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);

		const path = this.getTransitBackupKeyPath(name);
		const url = `${this._baseUrl}/${path}`;

		try {
			const response = await FetchHelper.fetchJson<
				never,
				IHashicorpVaultResponse<IBackupKeyResponse>
			>(this.CLASS_NAME, url, HttpMethod.GET, undefined, { headers: this._headers });

			if (response?.data?.backup) {
				const backup = response.data.backup;
				return backup;
			}

			throw new NotFoundError(this.CLASS_NAME, "backupKeyNotFound", name);
		} catch (err) {
			if (err instanceof NotFoundError) {
				throw err;
			}
			throw new GeneralError(this.CLASS_NAME, "backupKeyFailed", { name }, err);
		}
	}

	/**
	 * Restore a key to the vault.
	 * @param name The name of the key to restore.
	 * @param backup The backup of the key.
	 * @returns Nothing.
	 * @throws Error if the key cannot be restored.
	 */
	public async restoreKey(name: string, backup: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		Guards.stringValue(this.CLASS_NAME, nameof(backup), backup);

		const path = this.getTransitRestoreKeyPath(name);
		const url = `${this._baseUrl}/${path}`;

		try {
			const payload = { backup };

			await FetchHelper.fetchJson<IRestoreKeyRequest, IHashicorpVaultResponse<unknown>>(
				this.CLASS_NAME,
				url,
				HttpMethod.POST,
				payload,
				{ headers: this._headers }
			);
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "restoreKeyFailed", { name }, err);
		}
	}

	/**
	 * Read key information from the vault.
	 * @param name The name of the key.
	 * @returns An object containing key information.
	 * @internal
	 */
	private async readKey(name: string): Promise<{
		/**
		 * The name of the key.
		 */
		name: string;
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);

		const path = this.getTransitKeyPath(name);
		const url = `${this._baseUrl}/${path}`;

		try {
			const response = await FetchHelper.fetchJson<
				never,
				IHashicorpVaultResponse<IReadKeyResponse>
			>(this.CLASS_NAME, url, HttpMethod.GET, undefined, { headers: this._headers });

			if (response?.data?.name) {
				const keyName = response.data.name;
				return { name: keyName };
			}
			throw new NotFoundError(this.CLASS_NAME, "keyNotFound", name);
		} catch (err) {
			if (err instanceof FetchError && err.properties?.httpStatus === 404) {
				throw err;
			} else {
				throw new GeneralError(this.CLASS_NAME, "invalidReadKeyResponse", { name }, err);
			}
		}
	}

	/**
	 * Map the vault key type to the hashicorp type.
	 * @param type The vault key type.
	 * @returns The hashicorp type as a string.
	 * @throws Error if the key type is not supported.
	 * @internal
	 */
	private mapVaultKeyType(type: VaultKeyType): string {
		switch (type) {
			case VaultKeyType.Ed25519:
				return "ed25519";
			case VaultKeyType.ChaCha20Poly1305:
				return "chacha20-poly1305";
			default:
				throw new GeneralError(this.CLASS_NAME, "unsupportedKeyType", { type });
		}
	}

	/**
	 * Map the hashicorp key type to the vault type.
	 * @param type The hashicorp key type.
	 * @returns The vault key type.
	 * @throws Error if the key type is not supported.
	 * @internal
	 */
	private mapHashicorpKeyType(type: string): VaultKeyType {
		switch (type) {
			case "ed25519":
				return VaultKeyType.Ed25519;
			case "chacha20-poly1305":
				return VaultKeyType.ChaCha20Poly1305;
			default:
				throw new GeneralError(this.CLASS_NAME, "unsupportedKeyType", { type });
		}
	}

	/**
	 * Check if the key type is asymmetric.
	 * @param type The key type.
	 * @returns True if the key type is asymmetric.
	 */
	private isAsymmetricKeyType(type: VaultKeyType): boolean {
		switch (type) {
			case VaultKeyType.Ed25519:
			case VaultKeyType.Secp256k1:
				return true;
			default:
				return false;
		}
	}

	/**
	 * Export the private key from the vault.
	 * @param name The name of the key.
	 * @param version The version of the key. If omitted, all versions of the key will be returned.
	 * @returns The private key as a Uint8Array.
	 * @throws Error if the key cannot be exported or found.
	 */
	private async exportPrivateKey(
		name: string,
		version?: string
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
		 * The name of the key.
		 */
		name: string;
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);
		const versionPath = version ? `${version}` : "latest";

		const path = this.getTransitExportKeyPath(name, "signing-key");
		const url = `${this._baseUrl}/${path}/${versionPath}`;

		try {
			const response = await FetchHelper.fetchJson<
				never,
				IHashicorpVaultResponse<IExportPrivateKeyResponse>
			>(this.CLASS_NAME, url, HttpMethod.GET, undefined, { headers: this._headers });

			if (response?.data) {
				const { keys } = response.data;
				const keyVersion = Object.keys(keys)[0];
				const privateKeyBase64 = keys[keyVersion];
				const privateKey = Converter.base64ToBytes(privateKeyBase64);

				const type = this.mapHashicorpKeyType(response?.data?.type);

				const privateKeyData = {
					type,
					privateKey: Uint8Array.from(privateKey),
					name: response?.data?.name
				};
				return privateKeyData;
			}

			throw new NotFoundError(this.CLASS_NAME, "privateKeyNotFound", name);
		} catch (err) {
			if (err instanceof NotFoundError) {
				throw err;
			}
			throw new GeneralError(this.CLASS_NAME, "exportPrivateKeyFailed", { name }, err);
		}
	}

	/**
	 * Fetch the versions of a secret.
	 * @param name The name of the secret.
	 * @returns The versions of the secret.
	 * @throws Error if the secret is not found.
	 * @internal
	 */
	private async fetchSecretVersions(name: string): Promise<number[]> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);

		try {
			const path = this.getSecretMetadataPath(name);
			const url = `${this._baseUrl}/${path}`;

			const response = await FetchHelper.fetchJson<
				never,
				IHashicorpVaultResponse<ISecretVersionResponse>
			>(this.CLASS_NAME, url, HttpMethod.GET, undefined, { headers: this._headers });

			if (response?.data?.versions) {
				const versions = Object.keys(response.data.versions).map(Number);
				return versions;
			}
			throw new NotFoundError(this.CLASS_NAME, "versionsNotFound", name);
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "getSecretVersionsFailed", { name }, err);
		}
	}

	/**
	 * Get the path for a secret.
	 * @param name The name of the secret.
	 * @returns The path for the secret.
	 * @internal
	 */
	private getSecretPath(name: string): string {
		return `${this._kvMountPath}/data/${name}`;
	}

	/**
	 * Get the path for deleting a secret.
	 * @param name The name of the secret.
	 * @returns The path for deleting the secret.
	 * @internal
	 */
	private getDeleteSecretPath(name: string): string {
		return `${this._kvMountPath}/destroy/${name}`;
	}

	/**
	 * Get the path for the metadata of a secret.
	 * @param name The name of the secret.
	 * @returns The path for the metadata of the secret.
	 * @internal
	 */
	private getSecretMetadataPath(name: string): string {
		return `${this._kvMountPath}/metadata/${name}`;
	}

	/**
	 * Get the path for a Transit key.
	 * @param name The name of the key.
	 * @returns The path for the key.
	 * @internal
	 */
	private getTransitKeyPath(name: string): string {
		return `${this._transitMountPath}/keys/${name}`;
	}

	/**
	 * Get the path for exporting a Transit key.
	 * @param name The name of the key.
	 * @param keyType The type of the key.
	 * @returns The path for exporting the key.
	 * @internal
	 */
	private getTransitExportKeyPath(name: string, keyType: string): string {
		return `${this._transitMountPath}/export/${keyType}/${name}`;
	}

	/**
	 * Get the path for the Transit key config.
	 * @param name The name of the key to update.
	 * @returns The path for the key config.
	 * @internal
	 */
	private getTransitKeyConfigPath(name: string): string {
		return `${this._transitMountPath}/keys/${name}/config`;
	}

	/**
	 * Get the path to backup a Transit key.
	 * @param name The name of the key.
	 * @returns The path for the backup key.
	 * @internal
	 */
	private getTransitBackupKeyPath(name: string): string {
		return `${this._transitMountPath}/backup/${name}`;
	}

	/**
	 * Get the path for restoring a Transit key.
	 * @param name The name of the key.
	 * @returns The path for the restore key.
	 * @internal
	 */
	private getTransitRestoreKeyPath(name: string): string {
		return `${this._transitMountPath}/restore/${name}`;
	}

	/**
	 * Get the path for signing data with a Transit key.
	 * @param name The name of the key.
	 * @returns The path for the sign.
	 * @internal
	 */
	private getTransitSignPath(name: string): string {
		return `${this._transitMountPath}/sign/${name}`;
	}

	/**
	 * Get the path for verifying data with a Transit key.
	 * @param name The name of the key.
	 * @returns The path for the verify.
	 * @internal
	 */
	private getTransitVerifyPath(name: string): string {
		return `${this._transitMountPath}/verify/${name}`;
	}

	/**
	 * Get the  path for encrypting data with a Transit key.
	 * @param name The name of the key.
	 * @returns The path for encryption.
	 * @internal
	 */
	private getTransitEncryptPath(name: string): string {
		return `${this._transitMountPath}/encrypt/${name}`;
	}

	/**
	 * Get the  path for decrypting data with a Transit key.
	 * @param name The name of the key.
	 * @returns The path for decryption.
	 * @internal
	 */
	private getTransitDecryptPath(name: string): string {
		return `${this._transitMountPath}/decrypt/${name}`;
	}
}
