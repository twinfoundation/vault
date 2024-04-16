// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Guards, NotFoundError } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IVaultProvider } from "@gtsc/vault-provider-models";

/**
 * Class for performing vault operations in memory.
 */
export class MemoryVaultProvider implements IVaultProvider {
	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<MemoryVaultProvider>();

	/**
	 * The storage for the in memory items.
	 * @internal
	 */
	private readonly _store: { [id: string]: unknown };

	/**
	 * Create a new instance of MemoryVaultProvider.
	 */
	constructor() {
		this._store = {};
	}

	/**
	 * Get a secret from the vault.
	 * @param id The id of the item in the vault to get.
	 * @returns The item from the vault.
	 * @throws Error if the item is not found.
	 */
	public async get<T>(id: string): Promise<T> {
		Guards.string(MemoryVaultProvider._CLASS_NAME, nameof(id), id);

		if (!this._store[id]) {
			throw new NotFoundError(MemoryVaultProvider._CLASS_NAME, "notFound", id);
		}

		return this._store[id] as T;
	}

	/**
	 * Set a secret into the vault.
	 * @param id The id of the item in the vault to set.
	 * @param item The item to add to the vault.
	 * @returns Nothing.
	 */
	public async set<T>(id: string, item: T): Promise<void> {
		Guards.string(MemoryVaultProvider._CLASS_NAME, nameof(id), id);
		this._store[id] = item;
	}

	/**
	 * Remove a secret from the vault.
	 * @param id The id of the item in the vault to remove.
	 * @returns Nothing.
	 * @throws Error if the item is not found.
	 */
	public async remove(id: string): Promise<void> {
		Guards.string(MemoryVaultProvider._CLASS_NAME, nameof(id), id);

		if (!this._store[id]) {
			throw new NotFoundError(MemoryVaultProvider._CLASS_NAME, "notFound", id);
		}

		delete this._store[id];
	}
}
