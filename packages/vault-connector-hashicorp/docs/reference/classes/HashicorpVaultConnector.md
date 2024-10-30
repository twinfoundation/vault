# Class: HashicorpVaultConnector

Class for performing vault operations in entity storage.

## Implements

- `IVaultConnector`

## Constructors

### new HashicorpVaultConnector()

> **new HashicorpVaultConnector**(`options`): [`HashicorpVaultConnector`](HashicorpVaultConnector.md)

Create a new instance of HashicorpStorageVaultConnector.

#### Parameters

• **options**

The options for the vault connector.

• **options.config**: [`IHashicorpVaultConnectorConfig`](../interfaces/IHashicorpVaultConnectorConfig.md)

The configuration for the Hashicorp Vault connector.

#### Returns

[`HashicorpVaultConnector`](HashicorpVaultConnector.md)

## Properties

### NAMESPACE

> `readonly` `static` **NAMESPACE**: `string` = `"hashicorp-storage"`

The namespace supported by the vault connector.

***

### CLASS\_NAME

> `readonly` **CLASS\_NAME**: `string`

Runtime name for the class.

#### Implementation of

`IVaultConnector.CLASS_NAME`

## Methods

### bootstrap()

> **bootstrap**(`nodeLoggingConnectorType`?): `Promise`\<`boolean`\>

Bootstrap the vault connector and ensure connectivity.

#### Parameters

• **nodeLoggingConnectorType?**: `string`

The node logging connector type, defaults to "node-logging".

#### Returns

`Promise`\<`boolean`\>

True if the bootstrapping process was successful.

#### Implementation of

`IVaultConnector.bootstrap`

***

### setSecret()

> **setSecret**\<`T`\>(`name`, `data`): `Promise`\<`void`\>

Store a secret in the vault.

#### Type Parameters

• **T**

#### Parameters

• **name**: `string`

The name of the item in the vault to set.

• **data**: `T`

The item to add to the vault.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`IVaultConnector.setSecret`

***

### getSecret()

> **getSecret**\<`T`\>(`name`): `Promise`\<`T`\>

Get a secret from the vault.

#### Type Parameters

• **T**

#### Parameters

• **name**: `string`

The name of the item in the vault to get.

#### Returns

`Promise`\<`T`\>

The item from the vault.

#### Throws

Error if the item is not found.

#### Implementation of

`IVaultConnector.getSecret`

***

### removeSecret()

> **removeSecret**(`name`): `Promise`\<`void`\>

Remove a secret from the vault.

#### Parameters

• **name**: `string`

The name of the item in the vault to remove.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Throws

Error if the item is not found.

#### Implementation of

`IVaultConnector.removeSecret`

***

### createKey()

> **createKey**(`name`, `type`): `Promise`\<`Uint8Array`\>

Create a key in the vault.

#### Parameters

• **name**: `string`

The name of the key to create.

• **type**: `VaultKeyType`

The type of the key to create.

#### Returns

`Promise`\<`Uint8Array`\>

The private key.

#### Implementation of

`IVaultConnector.createKey`

***

### getKeyDeleteConfiguration()

> **getKeyDeleteConfiguration**(`name`): `Promise`\<`boolean`\>

Get the key configuration.

#### Parameters

• **name**: `string`

The name of the key to get the configuration for.

#### Returns

`Promise`\<`boolean`\>

True if the key can be deleted.

***

### addKey()

> **addKey**(`name`, `type`, `privateKey`, `publicKey`?): `Promise`\<`void`\>

Add a key to the vault.

#### Parameters

• **name**: `string`

The name of the key to add.

• **type**: `VaultKeyType`

The type of the key to add.

• **privateKey**: `Uint8Array`

The private key to add.

• **publicKey?**: `Uint8Array`

The public key, can be undefined if the key type is symmetric.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`IVaultConnector.addKey`

***

### getKey()

> **getKey**(`name`): `Promise`\<`object`\>

Get a key from the vault.

#### Parameters

• **name**: `string`

The name of the key to get.

#### Returns

`Promise`\<`object`\>

The key, publicKey can be undefined if key is symmetric.

##### type

> **type**: `VaultKeyType`

The type of the key e.g. Ed25519, Secp256k1.

##### privateKey

> **privateKey**: `Uint8Array`

The private key.

##### publicKey?

> `optional` **publicKey**: `Uint8Array`

The public key, which can be undefined if key type is symmetric.

#### Implementation of

`IVaultConnector.getKey`

***

### renameKey()

> **renameKey**(`name`, `newName`): `Promise`\<`void`\>

Rename a key in the vault.

#### Parameters

• **name**: `string`

The name of the key to rename.

• **newName**: `string`

The new name of the key.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`IVaultConnector.renameKey`

***

### removeKey()

> **removeKey**(`name`): `Promise`\<`void`\>

Remove a key from the vault.

#### Parameters

• **name**: `string`

The name of the key to remove.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`IVaultConnector.removeKey`

***

### sign()

> **sign**(`name`, `data`): `Promise`\<`Uint8Array`\>

Sign data.

#### Parameters

• **name**: `string`

The name of the key to use.

• **data**: `Uint8Array`

The data to sign.

#### Returns

`Promise`\<`Uint8Array`\>

The signature.

#### Implementation of

`IVaultConnector.sign`

***

### verify()

> **verify**(`name`, `data`, `signature`): `Promise`\<`boolean`\>

Verify a signature.

#### Parameters

• **name**: `string`

The name of the key to use.

• **data**: `Uint8Array`

The data to verify.

• **signature**: `Uint8Array`

The signature to verify.

#### Returns

`Promise`\<`boolean`\>

True if the signature is valid.

#### Implementation of

`IVaultConnector.verify`

***

### encrypt()

> **encrypt**(`name`, `encryptionType`, `data`): `Promise`\<`Uint8Array`\>

Encrypt data.

#### Parameters

• **name**: `string`

The name of the key to use.

• **encryptionType**: `0`

The type of encryption to use.

• **data**: `Uint8Array`

The data to encrypt.

#### Returns

`Promise`\<`Uint8Array`\>

The encrypted data.

#### Implementation of

`IVaultConnector.encrypt`

***

### decrypt()

> **decrypt**(`name`, `encryptionType`, `encryptedData`): `Promise`\<`Uint8Array`\>

Decrypt data.

#### Parameters

• **name**: `string`

The name of the key to use.

• **encryptionType**: `0`

The type of encryption to use.

• **encryptedData**: `Uint8Array`

The encrypted data to decrypt.

#### Returns

`Promise`\<`Uint8Array`\>

The decrypted data.

#### Implementation of

`IVaultConnector.decrypt`

***

### getSecretVersions()

> **getSecretVersions**(`name`): `Promise`\<`number`[]\>

Get the versions of a secret.

#### Parameters

• **name**: `string`

The name of the secret.

#### Returns

`Promise`\<`number`[]\>

The versions of the secret.

#### Throws

Error if the secret is not found.

***

### updateKeyConfig()

> **updateKeyConfig**(`name`, `deletionAllowed`?, `exportable`?): `Promise`\<`void`\>

Update the configuration of a key.

#### Parameters

• **name**: `string`

The name of the key to update.

• **deletionAllowed?**: `boolean`

Whether the key can be deleted.

• **exportable?**: `boolean`

Whether the key can be exported.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### backupKey()

> **backupKey**(`name`): `Promise`\<`string`\>

Backup a key from the vault.

#### Parameters

• **name**: `string`

The name of the key to backup.

#### Returns

`Promise`\<`string`\>

The private key as a Uint8Array.

#### Throws

Error if the key cannot be exported or found.

***

### restoreKey()

> **restoreKey**(`name`, `backup`): `Promise`\<`void`\>

Restore a key to the vault.

#### Parameters

• **name**: `string`

The name of the key to restore.

• **backup**: `string`

The backup of the key.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Throws

Error if the key cannot be restored.

***

### exportKey()

> **exportKey**(`name`, `keyPath`, `version`?): `Promise`\<`object`\>

Export the key from the vault.

#### Parameters

• **name**: `string`

The name of the key.

• **keyPath**: `"public-key"` \| `"signing-key"` \| `"encryption-key"`

The path of the key. Defaults to "signing-key".

• **version?**: `string`

The version of the key. If omitted, all versions of the key will be returned.

#### Returns

`Promise`\<`object`\>

The key details.

##### type

> **type**: `VaultKeyType`

The type of the key e.g. Ed25519, Secp256k1.

##### key

> **key**: `Uint8Array`

The key.

##### name

> **name**: `string`

The name of the key.

#### Throws

Error if the key cannot be exported or found.
