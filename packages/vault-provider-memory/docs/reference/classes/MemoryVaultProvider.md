# Class: MemoryVaultProvider

Class for performing vault operations in memory.

## Implements

- `IVaultProvider`

## Constructors

### constructor

• **new MemoryVaultProvider**(`config?`): [`MemoryVaultProvider`](MemoryVaultProvider.md)

Create a new instance of MemoryVaultProvider.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config?` | [`IMemoryVaultProviderConfig`](../interfaces/IMemoryVaultProviderConfig.md) | The configuration for the vault provider. |

#### Returns

[`MemoryVaultProvider`](MemoryVaultProvider.md)

## Methods

### get

▸ **get**\<`T`\>(`requestContext`, `id`): `Promise`\<`T`\>

Get a secret from the vault.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `id` | `string` | The id of the item in the vault to get. |

#### Returns

`Promise`\<`T`\>

The item from the vault.

**`Throws`**

Error if the item is not found.

#### Implementation of

IVaultProvider.get

___

### getStore

▸ **getStore**(`tenantId`): `undefined` \| \{ `[id: string]`: `unknown`;  }

Get the memory store for the specified tenant.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `tenantId` | `string` | The tenant id. |

#### Returns

`undefined` \| \{ `[id: string]`: `unknown`;  }

The store.

___

### remove

▸ **remove**(`requestContext`, `id`): `Promise`\<`void`\>

Remove a secret from the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `id` | `string` | The id of the item in the vault to remove. |

#### Returns

`Promise`\<`void`\>

Nothing.

**`Throws`**

Error if the item is not found.

#### Implementation of

IVaultProvider.remove

___

### set

▸ **set**\<`T`\>(`requestContext`, `id`, `item`): `Promise`\<`void`\>

Set a secret into the vault.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `id` | `string` | The id of the item in the vault to set. |
| `item` | `T` | The item to add to the vault. |

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

IVaultProvider.set
