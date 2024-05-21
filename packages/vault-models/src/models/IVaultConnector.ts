// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRequestContext, IService } from "@gtsc/services";
import type { VaultEncryptionType } from "./vaultEncryptionType";
import type { VaultKeyType } from "./vaultKeyType";

/**
 * Interface describing a vault securely storing data.
 */
export interface IVaultConnector extends IService {
	/**
	 * Create a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to create in the vault.
	 * @param type The type of key to create.
	 * @returns The public key for the key pair in base64.
	 */
	createKey(requestContext: IRequestContext, name: string, type: VaultKeyType): Promise<string>;

	/**
	 * Add a key to the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to add to the vault.
	 * @param type The type of key to add.
	 * @param privateKey The private key in base64 format.
	 * @param publicKey The public key in base64 format.
	 * @returns Nothing.
	 */
	addKey(
		requestContext: IRequestContext,
		name: string,
		type: VaultKeyType,
		privateKey: string,
		publicKey: string
	): Promise<void>;

	/**
	 * Get a key from the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to get from the vault.
	 * @returns The key.
	 */
	getKey(
		requestContext: IRequestContext,
		name: string
	): Promise<{
		/**
		 * The type of the key e.g. Ed25519, Secp256k1.
		 */
		type: VaultKeyType;

		/**
		 * The private key in base64 format.
		 */
		privateKey: string;

		/**
		 * The public key in base64 format.
		 */
		publicKey: string;
	}>;

	/**
	 * Rename a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to rename.
	 * @param newName The new name of the key.
	 * @returns Nothing.
	 */
	renameKey(requestContext: IRequestContext, name: string, newName: string): Promise<void>;

	/**
	 * Remove a key from the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to remove from the vault.
	 * @returns Nothing.
	 */
	removeKey(requestContext: IRequestContext, name: string): Promise<void>;

	/**
	 * Sign the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to use for signing.
	 * @param data The data to sign in base64 form.
	 * @returns The signature for the data in base64 form.
	 */
	sign(requestContext: IRequestContext, name: string, data: string): Promise<string>;

	/**
	 * Verify the signature of the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to use for verification.
	 * @param data The data that was signed in base64 form.
	 * @param signature The signature to verify in base64 form.
	 * @returns True if the verification is successful.
	 */
	verify(
		requestContext: IRequestContext,
		name: string,
		data: string,
		signature: string
	): Promise<boolean>;

	/**
	 * Encrypt the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to use for encryption.
	 * @param encryptionType The type of encryption to use.
	 * @param data The data to encrypt in base64 form.
	 * @returns The encrypted data in base64.
	 */
	encrypt(
		requestContext: IRequestContext,
		name: string,
		encryptionType: VaultEncryptionType,
		data: string
	): Promise<string>;

	/**
	 * Decrypt the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the key to use for decryption.
	 * @param encryptionType The type of encryption to use.
	 * @param encryptedData The data to decrypt in base64.
	 * @returns The decrypted data in base64.
	 */
	decrypt(
		requestContext: IRequestContext,
		name: string,
		encryptionType: VaultEncryptionType,
		encryptedData: string
	): Promise<string>;

	/**
	 * Store a secret in the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the secret in the vault to set.
	 * @param data The secret to add to the vault.
	 * @returns Nothing.
	 */
	setSecret<T>(requestContext: IRequestContext, name: string, data: T): Promise<void>;

	/**
	 * Get a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the secret in the vault to get.
	 * @returns The secret from the vault.
	 * @throws Error if the secret is not found.
	 */
	getSecret<T>(requestContext: IRequestContext, name: string): Promise<T>;

	/**
	 * Remove a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param name The name of the secret in the vault to remove.
	 * @returns Nothing.
	 * @throws Error if the secret is not found.
	 */
	removeSecret(requestContext: IRequestContext, name: string): Promise<void>;
}
