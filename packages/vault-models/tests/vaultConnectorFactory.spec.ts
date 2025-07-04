// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { VaultConnectorFactory } from "../src/factories/vaultConnectorFactory";
import type { IVaultConnector } from "../src/models/IVaultConnector";

describe("VaultConnectorFactory", () => {
	test("can add an item to the factory", async () => {
		VaultConnectorFactory.register("my-vault", () => ({}) as unknown as IVaultConnector);
	});
});
