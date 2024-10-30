// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to verify a signature.
 */
export interface IVerifyDataRequest {
	/**
	 * The original data that was signed, encoded in Base64.
	 */
	input: string;

	/**
	 * The signature to be verified, formatted as "vault:v1:5IH88/dx9ulO/7ygCpYGAevL3tL7JZdcQ7wEnFf6tHrFi8QVB6SnBvtoH98MrRnWHUT7amfQbIHsU4qSyTW/Bg==".
	 */
	signature: string;
}
