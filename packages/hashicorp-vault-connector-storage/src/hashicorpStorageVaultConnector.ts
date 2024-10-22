// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Guards, NotFoundError } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";
import {
	type IVaultConnector,
	type VaultEncryptionType,
	VaultKeyType
} from "@twin.org/vault-models";
import { BaseError } from "./../../../../framework/packages/core/src/errors/baseError";
import { GeneralError } from "./../../../../framework/packages/core/src/errors/generalError";
import { LoggingConnectorFactory } from "./../../../../logging/packages/logging-models/src/factories/loggingConnectorFactory";
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
		// CREATE KEY
		return new Uint8Array();
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
	): Promise<void> {}

	/**
	 * Get a key from the vault.
	 * @param name The name of the key to get.
	 * @returns The key.
	 */
	public async getKey(name: string): Promise<{
		// EXPORT KEY
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
		return {
			type: VaultKeyType.Ed25519,
			privateKey: new Uint8Array(),
			publicKey: new Uint8Array()
		};
	}

	/**
	 * Rename a key in the vault.
	 * @param name The name of the key to rename.
	 * @param newName The new name of the key.
	 * @returns Nothing.
	 */
	public async renameKey(name: string, newName: string): Promise<void> {}

	/**
	 * Remove a key from the vault.
	 * @param name The name of the key to remove.
	 * @returns Nothing.
	 */
	public async removeKey(name: string): Promise<void> {}

	/**
	 * Sign data.
	 * @param name The name of the key to use.
	 * @param data The data to sign.
	 * @returns The signature.
	 */
	public async sign(name: string, data: Uint8Array): Promise<Uint8Array> {
		// SIGN DATA
		return new Uint8Array();
	}

	/**
	 * Verify a signature.
	 * @param name The name of the key to use.
	 * @param data The data to verify.
	 * @param signature The signature to verify.
	 * @returns True if the signature is valid.
	 */
	public async verify(name: string, data: Uint8Array, signature: Uint8Array): Promise<boolean> {
		// VERIFY SIGNED DATA
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
		// ENCRYPT DATA
		name: string,
		encryptionType: VaultEncryptionType,
		data: Uint8Array
	): Promise<Uint8Array> {
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
	 * Fetch the versions of a secret.
	 * @param name The name of the secret.
	 * @returns The versions of the secret.
	 * @throws Error if the secret is not found.
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
	 */
	private getSecretPath(name: string): string {
		return `${this._kvMountPath}/data/${name}`;
	}

	/**
	 * Get the path for deleting a secret.
	 * @param name The name of the secret.
	 * @returns The path for deleting the secret.
	 */
	private getDeleteSecretPath(name: string): string {
		return `${this._kvMountPath}/destroy/${name}`;
	}

	/**
	 * Get the path for the metadata of a secret.
	 * @param name The name of the secret.
	 * @returns The path for the metadata of the secret.
	 */
	private getSecretMetadataPath(name: string): string {
		return `${this._kvMountPath}/metadata/${name}`;
	}

	// !TODO:
	// - Use the "Is" class to check for the type of the data. (Framework)
	// - Check out the "Converter" class for converting data types. (Framework)
}
