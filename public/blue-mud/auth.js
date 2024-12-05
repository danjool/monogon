import { BSKY_SERVICE } from './config.js';

export class AuthManager {
    static async login(identifier, password) {
        const response = await axios.post(`${BSKY_SERVICE}/xrpc/com.atproto.server.createSession`, {
            identifier, password
        });
        return {
            jwt: response.data.accessJwt,
            did: response.data.did
        };
    }
}