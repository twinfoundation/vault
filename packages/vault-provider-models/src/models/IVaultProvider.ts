// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRequestContext, IService } from "@gtsc/services";

/**
 * Interface describing a vault securely storing data.
 */
export interface IVaultProvider extends IService {
	/**
	 * Get a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param id The id of the item in the vault to get.
	 * @returns The item from the vault.
	 * @throws Error if the item is not found.
	 */
	get<T>(requestContext: IRequestContext, id: string): Promise<T>;

	/**
	 * Set a secret into the vault.
	 * @param requestContext The context for the request.
	 * @param id The id of the item in the vault to set.
	 * @param item The item to add to the vault.
	 * @returns Nothing.
	 */
	set<T>(requestContext: IRequestContext, id: string, item: T): Promise<void>;

	/**
	 * Remove a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param id The id of the item in the vault to remove.
	 * @returns Nothing.
	 * @throws Error if the item is not found.
	 */
	remove(requestContext: IRequestContext, id: string): Promise<void>;
}
