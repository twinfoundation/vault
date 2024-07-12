// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IServiceRequestContext, IService } from "@gtsc/services";
import type { VaultEncryptionType } from "./vaultEncryptionType";
import type { VaultKeyType } from "./vaultKeyType";

/**
 * Interface describing a vault securely storing data.
 */
export interface IVaultConnector extends IService {
	/**
	 * Create a key in the vault.
	 * @param name The name of the key to create in the vault.
	 * @param type The type of key to create.
	 * @param requestContext The context for the request.
	 * @returns The public key for the key pair.
	 */
	createKey(
		name: string,
		type: VaultKeyType,
		requestContext?: IServiceRequestContext
	): Promise<Uint8Array>;

	/**
	 * Add a key to the vault.
	 * @param name The name of the key to add to the vault.
	 * @param type The type of key to add.
	 * @param privateKey The private key.
	 * @param publicKey The public key.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	addKey(
		name: string,
		type: VaultKeyType,
		privateKey: Uint8Array,
		publicKey: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<void>;

	/**
	 * Get a key from the vault.
	 * @param name The name of the key to get from the vault.
	 * @param requestContext The context for the request.
	 * @returns The key.
	 */
	getKey(
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
	}>;

	/**
	 * Rename a key in the vault.
	 * @param name The name of the key to rename.
	 * @param newName The new name of the key.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	renameKey(name: string, newName: string, requestContext?: IServiceRequestContext): Promise<void>;

	/**
	 * Remove a key from the vault.
	 * @param name The name of the key to remove from the vault.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	removeKey(name: string, requestContext?: IServiceRequestContext): Promise<void>;

	/**
	 * Sign the data using a key in the vault.
	 * @param name The name of the key to use for signing.
	 * @param data The data to sign.
	 * @param requestContext The context for the request.
	 * @returns The signature for the data.
	 */
	sign(
		name: string,
		data: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<Uint8Array>;

	/**
	 * Verify the signature of the data using a key in the vault.
	 * @param name The name of the key to use for verification.
	 * @param data The data that was signed.
	 * @param signature The signature to verify.
	 * @param requestContext The context for the request.
	 * @returns True if the verification is successful.
	 */
	verify(
		name: string,
		data: Uint8Array,
		signature: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<boolean>;

	/**
	 * Encrypt the data using a key in the vault.
	 * @param name The name of the key to use for encryption.
	 * @param encryptionType The type of encryption to use.
	 * @param data The data to encrypt.
	 * @param requestContext The context for the request.
	 * @returns The encrypted data.
	 */
	encrypt(
		name: string,
		encryptionType: VaultEncryptionType,
		data: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<Uint8Array>;

	/**
	 * Decrypt the data using a key in the vault.
	 * @param name The name of the key to use for decryption.
	 * @param encryptionType The type of encryption to use.
	 * @param encryptedData The data to decrypt.
	 * @param requestContext The context for the request.
	 * @returns The decrypted data.
	 */
	decrypt(
		name: string,
		encryptionType: VaultEncryptionType,
		encryptedData: Uint8Array,
		requestContext?: IServiceRequestContext
	): Promise<Uint8Array>;

	/**
	 * Store a secret in the vault.
	 * @param name The name of the secret in the vault to set.
	 * @param data The secret to add to the vault.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	setSecret<T>(name: string, data: T, requestContext?: IServiceRequestContext): Promise<void>;

	/**
	 * Get a secret from the vault.
	 * @param name The name of the secret in the vault to get.
	 * @param requestContext The context for the request.
	 * @returns The secret from the vault.
	 * @throws Error if the secret is not found.
	 */
	getSecret<T>(name: string, requestContext?: IServiceRequestContext): Promise<T>;

	/**
	 * Remove a secret from the vault.
	 * @param name The name of the secret in the vault to remove.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 * @throws Error if the secret is not found.
	 */
	removeSecret(name: string, requestContext?: IServiceRequestContext): Promise<void>;
}
