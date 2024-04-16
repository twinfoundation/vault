// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { MemoryVaultProvider } from "../src/memoryVaultProvider";

describe("MemoryVaultProvider", () => {
	test("can construct with some initial values", async () => {
		const vault = new MemoryVaultProvider({
			initialValues: {
				"my-id": {
					foo: "bar"
				}
			}
		});
		const result = await vault.get<{
			foo: string;
		}>("my-id");
		expect(result).toBeDefined();
		expect(result.foo).toEqual("bar");
	});

	test("can fail to set an item with no id", async () => {
		const vault = new MemoryVaultProvider();
		await expect(vault.set(undefined as unknown as string, undefined)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "id",
				value: "undefined"
			}
		});
	});

	test("can set an item with data", async () => {
		const vault = new MemoryVaultProvider();
		const result = await vault.set("my-id", {
			foo: "bar"
		});
		expect(result).toBeUndefined();
	});

	test("can fail to get an item with no id", async () => {
		const vault = new MemoryVaultProvider();
		await expect(vault.get(undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "id",
				value: "undefined"
			}
		});
	});

	test("can fail to get an item that does not exist", async () => {
		const vault = new MemoryVaultProvider();
		await expect(vault.get("my-id")).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: "my-id"
			}
		});
	});

	test("can get an item with data", async () => {
		const vault = new MemoryVaultProvider();
		await vault.set("my-id", {
			foo: "bar"
		});
		const result = await vault.get<{
			foo: string;
		}>("my-id");
		expect(result).toBeDefined();
		expect(result.foo).toEqual("bar");
	});

	test("can fail to remove an item with no id", async () => {
		const vault = new MemoryVaultProvider();
		await expect(vault.remove(undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "id",
				value: "undefined"
			}
		});
	});

	test("can fail to remove an item that does not exist", async () => {
		const vault = new MemoryVaultProvider();
		await expect(vault.remove("my-id")).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: "my-id"
			}
		});
	});

	test("can remove an item with data", async () => {
		const vault = new MemoryVaultProvider();
		await vault.set("my-id", {
			foo: "bar"
		});
		await vault.remove("my-id");
		await expect(vault.get("my-id")).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: "my-id"
			}
		});
	});
});
