
// Mocking browser globals for the test BEFORE importing modules
global.localStorage = {
    getItem: () => null,
    setItem: (k, v) => console.log(`[Storage] Set ${k} = ${v}`),
    removeItem: (k) => console.log(`[Storage] Removed ${k}`)
};
global.window = {
    Toast: { show: (msg) => console.log(`[Toast] ${msg}`) },
    dispatchEvent: () => { }
};
global.fetch = async (url, config) => {
    console.log(`[MockFetch] ${config.method || 'POST'} ${url}`);
    if (url.includes('/api/auth/login')) {
        const body = JSON.parse(config.body);
        if (body.username === 'student' && body.password === 'magic-password') {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    data: { token: 'mock-token', user: { id: 1, username: 'student' } }
                })
            };
        } else {
            return {
                ok: false,
                status: 401,
                json: async () => ({ status: 'error', message: 'Invalid credentials' })
            };
        }
    }
    return { ok: false, status: 404 };
};

// Use dynamic import to ensure globals are set first
const { login } = await import('../src/renderer/utils/web-api.js');

async function testLoginFlow() {
    console.log("--- Testing Successful Login ---");
    try {
        const res = await login('student', 'magic-password');
        console.log("Response:", res);

        // This is the CRITICAL CHECK: did our fix work?
        // Before fix: res would be { token: ... } (no status)
        // After fix: res should be { status: 'success', data: { ... } }
        if (res.status === 'success') {
            console.log("PASS: Login returned success status.");
        } else {
            console.error("FAIL: Login did not return success status. Got:", JSON.stringify(res));
        }
    } catch (e) {
        console.error("FAIL: Login threw error", e);
    }

    console.log("\n--- Testing Failed Login ---");
    try {
        const res = await login('student', 'wrong-password');
        console.log("Response:", res);
    } catch (e) {
        console.log("PASS: Login correctly threw error for invalid credentials:", e.message);
    }
}

testLoginFlow();
