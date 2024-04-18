// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRequestContext } from "@gtsc/services";
import { MemoryVaultProvider } from "../src/memoryVaultProvider";

const TEST_TENANT_ID = "test-tenant";

describe("MemoryVaultProvider", () => {
	test("can construct with some initial values", async () => {
		const vault = new MemoryVaultProvider({
			initialValues: {
				[TEST_TENANT_ID]: {
					"my-id": {
						foo: "bar"
					}
				}
			}
		});
		const result = await vault.get<{
			foo: string;
		}>({ tenantId: TEST_TENANT_ID }, "my-id");
		expect(result).toBeDefined();
		expect(result.foo).toEqual("bar");
	});

	test("can fail to set an item with no request context", async () => {
		const vault = new MemoryVaultProvider();
		await expect(
			vault.set(undefined as unknown as IRequestContext, undefined as unknown as string, undefined)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to set an item with empy tenant id", async () => {
		const vault = new MemoryVaultProvider();
		await expect(vault.set({}, undefined as unknown as string, undefined)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to set an item with no id", async () => {
		const vault = new MemoryVaultProvider();
		await expect(
			vault.set({ tenantId: TEST_TENANT_ID }, undefined as unknown as string, undefined)
		).rejects.toMatchObject({
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
		await vault.set({ tenantId: TEST_TENANT_ID }, "my-id", {
			foo: "bar"
		});
		const store = vault.getStore(TEST_TENANT_ID);
		expect(store).toBeDefined();
		expect(store?.["my-id"]).toEqual({
			foo: "bar"
		});
	});

	test("can fail to get an item with no request context", async () => {
		const vault = new MemoryVaultProvider();
		await expect(
			vault.get(undefined as unknown as IRequestContext, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to get an item with no tenant id", async () => {
		const vault = new MemoryVaultProvider();
		await expect(vault.get({}, undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to get an item with no id", async () => {
		const vault = new MemoryVaultProvider();
		await expect(
			vault.get({ tenantId: TEST_TENANT_ID }, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "id",
				value: "undefined"
			}
		});
	});

	test("can fail to get an item that does not exist with non existent tenant id", async () => {
		const vault = new MemoryVaultProvider();
		await expect(vault.get({ tenantId: TEST_TENANT_ID }, "my-id")).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: "my-id"
			}
		});
	});

	test("can fail to get an item that does not exist", async () => {
		const vault = new MemoryVaultProvider();
		await vault.set({ tenantId: TEST_TENANT_ID }, "my-id2", "foo");
		await expect(vault.get({ tenantId: TEST_TENANT_ID }, "my-id")).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: "my-id"
			}
		});
	});

	test("can get an item with data", async () => {
		const vault = new MemoryVaultProvider();
		await vault.set({ tenantId: TEST_TENANT_ID }, "my-id", {
			foo: "bar"
		});
		const result = await vault.get<{
			foo: string;
		}>({ tenantId: TEST_TENANT_ID }, "my-id");
		expect(result).toBeDefined();
		expect(result.foo).toEqual("bar");
	});

	test("can fail to remove an item with no request context", async () => {
		const vault = new MemoryVaultProvider();
		await expect(
			vault.remove(undefined as unknown as IRequestContext, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.objectUndefined",
			properties: {
				property: "requestContext",
				value: "undefined"
			}
		});
	});

	test("can fail to remove an item with no tenant id", async () => {
		const vault = new MemoryVaultProvider();
		await expect(vault.remove({}, undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to remove an item with no id", async () => {
		const vault = new MemoryVaultProvider();
		await expect(
			vault.remove({ tenantId: TEST_TENANT_ID }, undefined as unknown as string)
		).rejects.toMatchObject({
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
		await expect(vault.remove({ tenantId: TEST_TENANT_ID }, "my-id")).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: "my-id"
			}
		});
	});

	test("can remove an item with data", async () => {
		const vault = new MemoryVaultProvider();
		await vault.set({ tenantId: TEST_TENANT_ID }, "my-id", {
			foo: "bar"
		});
		await vault.remove({ tenantId: TEST_TENANT_ID }, "my-id");
		await expect(vault.get({ tenantId: TEST_TENANT_ID }, "my-id")).rejects.toMatchObject({
			name: "NotFoundError",
			properties: {
				notFoundId: "my-id"
			}
		});
	});
});
