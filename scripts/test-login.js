async function testLogin() {
    console.log("Testing Login API...");
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'student',
                password: 'magic-password'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Login SUCCESS!");
            console.log("Response:", data);
        } else {
            console.error("Login FAILED with status:", response.status);
            const text = await response.text();
            console.error("Response:", text);
        }
    } catch (e) {
        console.error("Connection Failed:", e.message);
        console.log("Is the server running on port 3000?");
    }
}

testLogin();
