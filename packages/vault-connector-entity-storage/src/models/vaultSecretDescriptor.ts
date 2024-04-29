// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IEntityDescriptor } from "@gtsc/entity";
import { nameof } from "@gtsc/nameof";
import type { IVaultSecret } from "./IVaultSecret";

/**
 * Entity description for a IVaultSecret.
 * @returns The descriptor for the IVaultSecret.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const VaultSecretDescriptor: IEntityDescriptor<IVaultSecret> = {
	name: nameof<IVaultSecret>(),
	properties: [
		{
			property: "id",
			type: "string",
			isPrimary: true
		},
		{
			property: "data",
			type: "string"
		}
	]
};
