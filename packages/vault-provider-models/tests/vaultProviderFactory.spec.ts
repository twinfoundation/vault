// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { VaultProviderFactory } from "../src/factories/vaultProviderFactory";
import type { IVaultProvider } from "../src/models/IVaultProvider";

describe("VaultProviderFactory", () => {
	test("can add an item to the factory", async () => {
		VaultProviderFactory.register("my-vault", () => ({}) as unknown as IVaultProvider);
	});
});
