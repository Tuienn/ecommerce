export interface IKeyPair {
    publicKey: string
    secretKey: string
}

export interface IEncryptedMessage {
    encryptedContent: string
    nonce: string
}

export interface IEncryptedPrivateKey {
    encryptedPrivateKey: string
    nonce: string
}

export interface IChatMessage {
    text: string
    sender: string
    isMine: boolean
    time: string
}

export interface IRegisterChatKeyData {
    publicKey: string
    encryptedPrivateKey: string
    privateKeyNonce: string
    kdfSalt: string
    kdfParams: {
        algorithm: string
        iterations: number
        hash: string
    }
}
