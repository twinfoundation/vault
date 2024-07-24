// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@gtsc/entity";
import { nameof } from "@gtsc/nameof";
import { VaultKey } from "./entities/vaultKey";
import { VaultSecret } from "./entities/vaultSecret";

/**
 * Initialize the schema for the vault connector entity storage.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof<VaultKey>(), () => EntitySchemaHelper.getSchema(VaultKey));
	EntitySchemaFactory.register(nameof<VaultSecret>(), () =>
		EntitySchemaHelper.getSchema(VaultSecret)
	);
}