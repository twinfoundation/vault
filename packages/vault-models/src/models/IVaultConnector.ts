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
	 * @param keyName The name of the key to create in the vault.
	 * @param keyType The type of key to create.
	 * @returns The public key for the key pair.
	 */
	createKey(
		requestContext: IRequestContext,
		keyName: string,
		keyType: VaultKeyType
	): Promise<Uint8Array>;

	/**
	 * Remove a key from the vault.
	 * @param requestContext The context for the request.
	 * @param keyName The name of the key to remove from the vault.
	 * @returns Nothing.
	 */
	removeKey(requestContext: IRequestContext, keyName: string): Promise<void>;

	/**
	 * Sign the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param keyName The name of the key to use for signing.
	 * @param data The data to sign.
	 * @returns The signature for the data.
	 */
	sign(requestContext: IRequestContext, keyName: string, data: Uint8Array): Promise<Uint8Array>;

	/**
	 * Verify the signature of the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param keyName The name of the key to use for verification.
	 * @param data The data that was signed.
	 * @param signature The signature to verify.
	 * @returns True if the verification is successful.
	 */
	verify(
		requestContext: IRequestContext,
		keyName: string,
		data: Uint8Array,
		signature: Uint8Array
	): Promise<boolean>;

	/**
	 * Encrypt the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param keyName The name of the key to use for encryption.
	 * @param encryptionType The type of encryption to use.
	 * @param data The data to encrypt.
	 * @returns The encrypted data.
	 */
	encrypt(
		requestContext: IRequestContext,
		keyName: string,
		encryptionType: VaultEncryptionType,
		data: Uint8Array
	): Promise<Uint8Array>;

	/**
	 * Decrypt the data using a key in the vault.
	 * @param requestContext The context for the request.
	 * @param keyName The name of the key to use for decryption.
	 * @param encryptionType The type of encryption to use.
	 * @param encryptedData The data to decrypt.
	 * @returns The decrypted data.
	 */
	decrypt(
		requestContext: IRequestContext,
		keyName: string,
		encryptionType: VaultEncryptionType,
		encryptedData: Uint8Array
	): Promise<Uint8Array>;

	/**
	 * Store a secret in the vault.
	 * @param requestContext The context for the request.
	 * @param secretName The name of the secret in the vault to set.
	 * @param data The secret to add to the vault.
	 * @returns Nothing.
	 */
	storeSecret<T>(requestContext: IRequestContext, secretName: string, data: T): Promise<void>;

	/**
	 * Get a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param secretName The name of the secret in the vault to get.
	 * @returns The secret from the vault.
	 * @throws Error if the secret is not found.
	 */
	retrieveSecret<T>(requestContext: IRequestContext, secretName: string): Promise<T>;

	/**
	 * Remove a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param secretName The name of the secret in the vault to remove.
	 * @returns Nothing.
	 * @throws Error if the secret is not found.
	 */
	removeSecret(requestContext: IRequestContext, secretName: string): Promise<void>;
}
