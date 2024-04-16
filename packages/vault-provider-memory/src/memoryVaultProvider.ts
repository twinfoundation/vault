// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Is, Guards, NotFoundError } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IVaultProvider } from "@gtsc/vault-provider-models";
import type { IMemoryVaultProviderConfig } from "./models/IMemoryVaultProviderConfig";

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
	private readonly _store: { [tenantId: string]: { [id: string]: unknown } };

	/**
	 * Create a new instance of MemoryVaultProvider.
	 * @param config The configuration for the vault provider.
	 */
	constructor(config?: IMemoryVaultProviderConfig) {
		this._store = config?.initialValues ?? {};
	}

	/**
	 * Get a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param id The id of the item in the vault to get.
	 * @returns The item from the vault.
	 * @throws Error if the item is not found.
	 */
	public async get<T>(requestContext: IRequestContext, id: string): Promise<T> {
		Guards.object<IRequestContext>(MemoryVaultProvider._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.string(MemoryVaultProvider._CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.string(MemoryVaultProvider._CLASS_NAME, nameof(id), id);

		if (Is.undefined(this._store[requestContext.tenantId]?.[id])) {
			throw new NotFoundError(MemoryVaultProvider._CLASS_NAME, "notFound", id);
		}

		return this._store[requestContext.tenantId][id] as T;
	}

	/**
	 * Set a secret into the vault.
	 * @param requestContext The context for the request.
	 * @param id The id of the item in the vault to set.
	 * @param item The item to add to the vault.
	 * @returns Nothing.
	 */
	public async set<T>(requestContext: IRequestContext, id: string, item: T): Promise<void> {
		Guards.object<IRequestContext>(MemoryVaultProvider._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.string(MemoryVaultProvider._CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.string(MemoryVaultProvider._CLASS_NAME, nameof(id), id);
		this._store[requestContext.tenantId] ??= {};
		this._store[requestContext.tenantId][id] = item;
	}

	/**
	 * Remove a secret from the vault.
	 * @param requestContext The context for the request.
	 * @param id The id of the item in the vault to remove.
	 * @returns Nothing.
	 * @throws Error if the item is not found.
	 */
	public async remove(requestContext: IRequestContext, id: string): Promise<void> {
		Guards.object<IRequestContext>(MemoryVaultProvider._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.string(MemoryVaultProvider._CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.string(MemoryVaultProvider._CLASS_NAME, nameof(id), id);

		if (Is.undefined(this._store[requestContext.tenantId]?.[id])) {
			throw new NotFoundError(MemoryVaultProvider._CLASS_NAME, "notFound", id);
		}

		delete this._store[requestContext.tenantId][id];
	}
}
