import keyManagementApi from '.'
import { IGenerateKey, IDecryptDek } from '../../types/keyManagement'
import { decryptData, encryptData } from './utils'

export default class KeyManagementApiService {
    static async generateKey(): Promise<IGenerateKey> {
        return await keyManagementApi('get', '/generate-key')
    }

    static async decryptDek(encryptedDek: string): Promise<IDecryptDek> {
        return await keyManagementApi(
            'post',
            '/decrypt-dek',
            {},
            {
                encryptedDek
            }
        )
    }

    static async encryptDataByApi(obj: any) {
        const { plainKey, encryptedKey } = await KeyManagementApiService.generateKey()
        return {
            encryptedData: encryptData(obj, plainKey),
            encryptedKey
        }
    }

    static async decryptDataByApi(obj: any, encryptedKey: string) {
        const { plainKey } = await KeyManagementApiService.decryptDek(encryptedKey)
        const result = decryptData(obj, plainKey)
        return result
    }
}
