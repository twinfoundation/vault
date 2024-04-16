// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@gtsc/core";
import type { IVaultProvider } from "../models/IVaultProvider";

/**
 * Factory for creating vaults.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const VaultProviderFactory = new Factory<IVaultProvider>("vault");
