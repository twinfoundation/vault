// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Represents the response received after signing the data.
 */
export interface ISignDataResponse {
	/**
	 * The signature of the data, formatted as "vault:v1:5IH88/dx9ulO/7ygCpYGAevL3tL7JZdcQ7wEnFf6tHrFi8QVB6SnBvtoH98MrRnWHUT7amfQbIHsU4qSyTW/Bg==".
	 */
	signature: string;
}
