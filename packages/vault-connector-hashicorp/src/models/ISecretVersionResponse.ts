// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Represents the response received when fetching the versions of a secret.
 */
export interface ISecretVersionResponse {
	/**
	 * A dictionary mapping the version numbers to their respective metadata.
	 */
	versions: {
		[version: string]: {
			created_time: string;
			deletion_time: string;
			destroyed: boolean;
		};
	};
}
