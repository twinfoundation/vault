// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Guards, NotFoundError, BaseError, GeneralError } from "@twin.org/core";
import { LoggingConnectorFactory } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import { type IVaultConnector, VaultEncryptionType, VaultKeyType } from "@twin.org/vault-models";
import type { IHashicorpVaultConnectorConfig } from "./models/IHashicorpVaultConnectorConfig";

/**
 * Class for performing vault operations in entity storage.
 */
export class HashicorpStorageVaultConnector implements IVaultConnector {
	/**
	 * The namespace supported by the vault connector.
	 */
	public static readonly NAMESPACE: string = "hashicorp-storage";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<HashicorpStorageVaultConnector>();

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
	private readonly _headers: { [key: string]: string };

	/**
	 * Create a new instance of HashicorpStorageVaultConnector.
	 * @param options The options for the vault connector.
	 * @param options.loggingConnectorType The logging connector type, defaults to "node-logging".
	 * @param options.config The configuration for the Hashicorp Vault connector.
	 */
	constructor(options: { loggingConnectorType?: string; config: IHashicorpVaultConnectorConfig }) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IHashicorpVaultConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.address), options.config.address);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.token), options.config.token);

		this._config = options.config;
		this._kvMountPath = this._config.kvMountPath ?? "secret";
		this._transitMountPath = this._config.transitMountPath ?? "transit";
		this._baseUrl = `${this._config.address}/v1`;
		this._headers = {
			"X-Vault-Token": this._config.token,
			"Content-Type": "application/json"
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
			// Check if the vault is healthy
			await fetch(`${this._baseUrl}/sys/health`, {
				method: "GET",
				headers: this._headers
			});

			await nodeLogging?.log({
				level: "info",
				source: this.CLASS_NAME,
				ts: Date.now(),
				message: "hashicorpVaultConnected",
				data: {
					address: this._config.address,
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
					address: this._config.address,
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

			await fetch(url, {
				method: "POST",
				headers: this._headers,
				body: JSON.stringify(payload)
			});
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
			const path = this.getSecretPath(name);
			const url = `${this._baseUrl}/${path}`;

			const response = await fetch(url, {
				method: "GET",
				headers: this._headers
			});

			if (response.status === 404) {
				throw new NotFoundError(this.CLASS_NAME, "secretNotFound", name);
			}

			const jsonResponse = await response.json();

			return jsonResponse.data.data as T;
		} catch (err) {
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
			const versions = await this.getSecretVersions(name);

			const path = this.getDeleteSecretPath(name);
			const url = `${this._baseUrl}/${path}`;

			await fetch(url, {
				method: "PUT",
				headers: this._headers,
				body: JSON.stringify({ versions })
			});
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

		try {
			const path = this.getTransitKeyPath(name);
			const url = `${this._baseUrl}/${path}`;

			const vaultKeyType = this.mapVaultKeyType(type);

			const payload = {
				type: vaultKeyType,
				exportable: this.isAsymmetricKeyType(type),
				allow_plaintext_backup: true // eslint-disable-line camelcase
			};

			const response = await fetch(url, {
				method: "POST",
				headers: this._headers,
				body: JSON.stringify(payload)
			});

			const jsonResponse = await response.json();

			// eslint-disable-next-line no-console
			console.log({ createKey: jsonResponse.data.keys });

			if (this.isAsymmetricKeyType(type)) {
				const publicKey = await this.getPublicKey(name);
				return publicKey;
			}

			const privateKey = await this.exportPrivateKey(name, type);
			return privateKey.privateKey;
		} catch (err) {
			// eslint-disable-next-line no-console
			console.log(err);
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
			const response = await fetch(url, {
				method: "GET",
				headers: this._headers
			});

			const jsonResponse = await response.json();

			return jsonResponse.data.deletion_allowed;
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
		throw new GeneralError(this.CLASS_NAME, "addKeyNotSupported");
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
			const path = this.getTransitKeyPath(name);
			const url = `${this._baseUrl}/${path}`;

			await this.updateKeyConfig(name, true);

			await fetch(url, {
				method: "DELETE",
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
			const path = this.getTransitSignPath(name);
			const url = `${this._baseUrl}/${path}`;

			const base64Data = Buffer.from(data).toString("base64");

			const payload = {
				input: base64Data
			};

			const response = await fetch(url, {
				method: "POST",
				headers: this._headers,
				body: JSON.stringify(payload)
			});

			const jsonResponse = await response.json();
			if (jsonResponse?.data?.signature) {
				const signature = jsonResponse.data.signature;
				return Buffer.from(signature);
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
			const path = this.getTransitVerifyPath(name);
			const url = `${this._baseUrl}/${path}`;

			const base64Data = Buffer.from(data).toString("base64");
			const signatureString = Buffer.from(signature).toString("utf8");

			const payload = {
				input: base64Data,
				signature: signatureString
			};

			const response = await fetch(url, {
				method: "POST",
				headers: this._headers,
				body: JSON.stringify(payload)
			});

			const jsonResponse = await response.json();
			if (jsonResponse?.data?.valid) {
				return jsonResponse.data.valid;
			}
			throw new GeneralError(this.CLASS_NAME, "invalidSignature", { name });
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "verifyDataFailed", { name }, err);
		}
		return false;
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
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);
		// Guards.arrayOneOf<VaultEncryptionType>(
		// 	this.CLASS_NAME,
		// 	nameof(encryptionType),
		// 	encryptionType,
		// 	Object.values(encryptionType)
		// );

		try {
			const path = this.getTransitEncryptPath(name);
			const url = `${this._baseUrl}/${path}`;

			const base64ata = Buffer.from(data).toString("base64");

			const payload = {
				plaintext: base64ata
			};

			const response = await fetch(url, {
				method: "POST",
				headers: this._headers,
				body: JSON.stringify(payload)
			});

			const jsonResponse = await response.json();
			// eslint-disable-next-line no-console
			console.log({ encrypt: jsonResponse });
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "encryptDataFailed", { name, encryptionType }, err);
		}
		return new Uint8Array();
	}

	/**
	 * Decrypt data.
	 * @param name The name of the key to use.
	 * @param encryptionType The type of encryption to use.
	 * @param encryptedData The encrypted data to decrypt.
	 * @returns The decrypted data.
	 */
	public async decrypt(
		// DECRYPT DATA
		name: string,
		encryptionType: VaultEncryptionType,
		encryptedData: Uint8Array
	): Promise<Uint8Array> {
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
	 * @returns Nothing.
	 */
	public async updateKeyConfig(name: string, deletionAllowed: boolean): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(name), name);

		try {
			const path = this.getTransitKeyConfigPath(name);
			const url = `${this._baseUrl}/${path}`;

			const payload = {
				deletion_allowed: deletionAllowed // eslint-disable-line camelcase
			};

			await fetch(url, {
				method: "POST",
				headers: this._headers,
				body: JSON.stringify(payload)
			});
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
			const response = await fetch(url, {
				method: "GET",
				headers: this._headers
			});

			const jsonResponse = await response.json();

			// eslint-disable-next-line no-console
			console.log({ getPublicKey: jsonResponse });

			if (jsonResponse?.data === undefined) {
				throw new NotFoundError(this.CLASS_NAME, "publicKeyNotFound", name);
			}

			if (jsonResponse?.data?.keys[1]) {
				const publicKey = jsonResponse.data.keys[1];
				return publicKey;
			}

			throw new NotFoundError(this.CLASS_NAME, "publicKeyNotFound", name);
		} catch (err) {
			if (err instanceof NotFoundError) {
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
			const response = await fetch(url, {
				method: "GET",
				headers: this._headers
			});

			const jsonResponse = await response.json();

			if (jsonResponse?.data?.backup) {
				const backup = jsonResponse.data.backup;
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

			await fetch(url, {
				method: "POST",
				headers: this._headers,
				body: JSON.stringify(payload)
			});
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "restoreKeyFailed", { name }, err);
		}
	}

	/**
	 * Map the vault key type to the hashicorp type.
	 * @param type The vault key type.
	 * @returns The hashicorp type as a string.
	 * @throws Error if the key type is not supported.
	 */
	public mapVaultKeyType(type: VaultKeyType): string {
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
	 * Map the vault encryption type to the hashicorp type.
	 * @param type The vault encryption type.
	 * @returns The hashicorp type as a string.
	 * @throws Error if the encryption type is not supported.
	 */
	public mapVaultEncryptionType(type: VaultEncryptionType): string {
		switch (type) {
			case VaultEncryptionType.ChaCha20Poly1305:
				return "chacha20-poly1305";
			default:
				throw new GeneralError(this.CLASS_NAME, "unsupportedEncryptionType", { type });
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
	 * @param type The type of the key.
	 * @param version The version of the key. If omitted, all versions of the key will be returned.
	 * @returns The private key as a Uint8Array.
	 * @throws Error if the key cannot be exported or found.
	 */
	private async exportPrivateKey(
		name: string,
		type?: VaultKeyType,
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

		let keyType;
		if (type && !this.isAsymmetricKeyType(type)) {
			keyType = "encryption-key";
		} else {
			keyType = "signing-key";
		}

		const path = this.getTransitExportKeyPath(name, keyType);
		const url = `${this._baseUrl}/${path}/${versionPath}`;

		try {
			const response = await fetch(url, {
				method: "GET",
				headers: this._headers
			});

			const jsonResponse = await response.json();

			if (jsonResponse?.data === undefined) {
				throw new NotFoundError(this.CLASS_NAME, "privateKeyNotFound", name);
			}

			if (jsonResponse?.data) {
				const privateKeyData = {
					type: jsonResponse?.data?.type,
					privateKey: jsonResponse?.data?.keys[1],
					name: jsonResponse?.data?.name
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

			const response = await fetch(url, {
				method: "GET",
				headers: this._headers
			});

			const responseJson = await response.json();

			if (responseJson?.data?.versions) {
				const versions = Object.keys(responseJson.data.versions).map(Number);
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
	 * Get the  paths for encrypting data with a Transit key.
	 * @param name The name of the key.
	 * @returns The path for encryption.
	 * @internal
	 */
	private getTransitEncryptPath(name: string): string {
		return `${this._transitMountPath}/encrypt/${name}`;
	}

	// ! TODO:
	// - Use the "Is" class to check for the type of the data. (Framework)
	// - Check out the "Converter" class for converting data types. (Framework)
	// - When running Docker make sure to enable transit for the vault. (Docker)
	// - Use the Coerce where you are using (Number) to convert the string to a number. (Framework)
	// - Look at the encoding folder in the Core package
}
