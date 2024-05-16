// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { entity, property } from "@gtsc/entity";

/**
 * Class defining a vault secret.
 */
@entity()
export class VaultSecret {
	/**
	 * The id.
	 */
	@property({ type: "string", isPrimary: true })
	public id!: string;

	/**
	 * The JSON stringified data for the secret.
	 */
	@property({ type: "string" })
	public data!: string;
}
