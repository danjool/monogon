import { BSKY_SERVICE } from './config.js';

export class AuthManager {
    static async login(identifier, password) {
        const response = await axios.post(`${BSKY_SERVICE}/xrpc/com.atproto.server.createSession`, {
            identifier, 
            password
        });

        if (!response.data.accessJwt || !response.data.did) {
            throw new Error('Invalid login response');
        }

        return {
            jwt: response.data.accessJwt,
            did: response.data.did
        };
    }

    static async validateSession(jwt) {
        try {
            await axios.get(`${BSKY_SERVICE}/xrpc/com.atproto.server.getSession`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            return true;
        } catch {
            return false;
        }
    }
}