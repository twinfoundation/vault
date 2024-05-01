# Interface: IVaultConnector

Interface describing a vault securely storing data.

## Hierarchy

- `IService`

  ↳ **`IVaultConnector`**

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

___

### bootstrap

▸ **bootstrap**(`requestContext`): `Promise`\<`void`\>

Bootstrap the service by creating and initializing any resources it needs.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The request context for bootstrapping. |

#### Returns

`Promise`\<`void`\>

Nothing.

#### Inherited from

IService.bootstrap

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
| `name` | `string` | The name of the secret in the vault to get. |

#### Returns

`Promise`\<`T`\>

The secret from the vault.

**`Throws`**

Error if the secret is not found.

___

### removeKey

▸ **removeKey**(`requestContext`, `name`): `Promise`\<`void`\>

Remove a key from the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the key to remove from the vault. |

#### Returns

`Promise`\<`void`\>

Nothing.

___

### removeSecret

▸ **removeSecret**(`requestContext`, `name`): `Promise`\<`void`\>

Remove a secret from the vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the secret in the vault to remove. |

#### Returns

`Promise`\<`void`\>

Nothing.

**`Throws`**

Error if the secret is not found.

___

### setSecret

▸ **setSecret**\<`T`\>(`requestContext`, `name`, `data`): `Promise`\<`void`\>

Store a secret in the vault.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestContext` | `IRequestContext` | The context for the request. |
| `name` | `string` | The name of the secret in the vault to set. |
| `data` | `T` | The secret to add to the vault. |

#### Returns

`Promise`\<`void`\>

Nothing.

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

___

### start

▸ **start**(): `Promise`\<`void`\>

The service needs to be started when the application is initialized.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Inherited from

IService.start

___

### stop

▸ **stop**(): `Promise`\<`void`\>

The service needs to be stopped when the application is closed.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Inherited from

IService.stop

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