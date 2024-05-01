# Class: EntityStorageVaultConnector

Class for performing vault operations in memory.

## Implements

- `IVaultConnector`

## Constructors

### constructor

• **new EntityStorageVaultConnector**(`dependencies`): [`EntityStorageVaultConnector`](EntityStorageVaultConnector.md)

Create a new instance of EntityStorageVaultConnector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `dependencies` | `Object` | The dependencies for the logging connector. |
| `dependencies.vaultKeyEntityStorageConnector` | `IEntityStorageConnector`\<[`IVaultKey`](../interfaces/IVaultKey.md)\> | The vault key entity storage connector dependency. |
| `dependencies.vaultSecretEntityStorageConnector` | `IEntityStorageConnector`\<[`IVaultSecret`](../interfaces/IVaultSecret.md)\> | The vault secret entity storage connector dependency. |

#### Returns

[`EntityStorageVaultConnector`](EntityStorageVaultConnector.md)

## Methods

### addKey

▸ **addKey**(`requestContext`, `name`, `type`, `privateKey`, `publicKey`): `Promise`\<`void`\>

Add a key to the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the key to add to the vault. |
| `type` | ``"Ed25519"`` | The type of key to add. |
| `privateKey` | `string` | The private key in base64 format. |
| `publicKey` | `string` | The public key in base64 format. |

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

IVaultConnector.addKey

___

### createKey

▸ **createKey**(`requestContext`, `name`, `type`): `Promise`\<`Uint8Array`\>

Create a key in the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the key to create in the vault. |
| `type` | ``"Ed25519"`` | The type of key to create. |

#### Returns

`Promise`\<`Uint8Array`\>

The public key for the key pair.

#### Implementation of

IVaultConnector.createKey

___

### decrypt

▸ **decrypt**(`requestContext`, `name`, `encryptionType`, `encryptedData`): `Promise`\<`Uint8Array`\>

Decrypt the data using a key in the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the key to use for decryption. |
| `encryptionType` | ``"ChaCha20Poly1305"`` | The type of encryption to use. |
| `encryptedData` | `Uint8Array` | The data to decrypt. |

#### Returns

`Promise`\<`Uint8Array`\>

The decrypted data.

#### Implementation of

IVaultConnector.decrypt

___

### encrypt

▸ **encrypt**(`requestContext`, `name`, `encryptionType`, `data`): `Promise`\<`Uint8Array`\>

Encrypt the data using a key in the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the key to use for encryption. |
| `encryptionType` | ``"ChaCha20Poly1305"`` | The type of encryption to use. |
| `data` | `Uint8Array` | The data to encrypt. |

#### Returns

`Promise`\<`Uint8Array`\>

The encrypted data.

#### Implementation of

IVaultConnector.encrypt

___

### getKey

▸ **getKey**(`requestContext`, `name`): `Promise`\<\{ `privateKey`: `string` ; `publicKey`: `string` ; `type`: ``"Ed25519"``  }\>

Get a key from the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the key to get from the vault. |

#### Returns

`Promise`\<\{ `privateKey`: `string` ; `publicKey`: `string` ; `type`: ``"Ed25519"``  }\>

The key.

#### Implementation of

IVaultConnector.getKey

___

### getSecret

▸ **getSecret**\<`T`\>(`requestContext`, `name`): `Promise`\<`T`\>

Get a secret from the vault.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the item in the vault to get. |

#### Returns

`Promise`\<`T`\>

The item from the vault.

**`Throws`**

Error if the item is not found.

#### Implementation of

IVaultConnector.getSecret

___

### removeKey

▸ **removeKey**(`requestContext`, `name`): `Promise`\<`void`\>

Remove a key from the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the key to create in the value. |

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

IVaultConnector.removeKey

___

### removeSecret

▸ **removeSecret**(`requestContext`, `name`): `Promise`\<`void`\>

Remove a secret from the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the item in the vault to remove. |

#### Returns

`Promise`\<`void`\>

Nothing.

**`Throws`**

Error if the item is not found.

#### Implementation of

IVaultConnector.removeSecret

___

### setSecret

▸ **setSecret**\<`T`\>(`requestContext`, `name`, `item`): `Promise`\<`void`\>

Store a secret in the vault.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the item in the vault to set. |
| `item` | `T` | The item to add to the vault. |

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

IVaultConnector.setSecret

___

### sign

▸ **sign**(`requestContext`, `name`, `data`): `Promise`\<`Uint8Array`\>

Sign the data using a key in the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the key to use for signing. |
| `data` | `Uint8Array` | The data to sign. |

#### Returns

`Promise`\<`Uint8Array`\>

The signature for the data.

#### Implementation of

IVaultConnector.sign

___

### verify

▸ **verify**(`requestContext`, `name`, `data`, `signature`): `Promise`\<`boolean`\>

Verify the signature of the data using a key in the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the key to use for verification. |
| `data` | `Uint8Array` | The data that was signed. |
| `signature` | `Uint8Array` | The signature to verify. |

#### Returns

`Promise`\<`boolean`\>

True if the verification is successful.

#### Implementation of

IVaultConnector.verify