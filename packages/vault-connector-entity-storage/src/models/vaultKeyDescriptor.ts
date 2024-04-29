// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IEntityDescriptor } from "@gtsc/entity";
import { nameof } from "@gtsc/nameof";
import type { IVaultKey } from "./IVaultKey";

/**
 * Entity description for a IVaultKey.
 * @returns The descriptor for the IVaultKey.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const VaultKeyDescriptor: IEntityDescriptor<IVaultKey> = {
	name: nameof<IVaultKey>(),
	properties: [
		{
			property: "id",
			type: "string",
			isPrimary: true
		},
		{
			property: "type",
			type: "string"
		},
		{
			property: "privateKey",
			type: "string"
		},
		{
			property: "publicKey",
			type: "string"
		}
	]
};
