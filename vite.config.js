import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

function copyLocalesPlugin() {
    return {
        name: 'copy-locales',
        closeBundle() {
            const src = path.join(__dirname, 'src/renderer/locales');
            const dest = path.join(__dirname, 'dist/locales');
            if (fs.existsSync(src)) {
                fs.cpSync(src, dest, { recursive: true });
                console.log('[Vite] Successfully copied locales to dist/locales');
            }
        }
    };
}

export default defineConfig({
    plugins: [copyLocalesPlugin()],
    root: path.join(__dirname, 'src/renderer'), // Set the root to the renderer directory
    publicDir: path.join(__dirname, 'src/renderer/assets'), // If you have a separate public dir, otherwise assets in root are fine
    base: './', // Use relative paths for assets in build
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
            '/uploads': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            }
        }
    },
    build: {
        outDir: path.join(__dirname, 'dist'),
        emptyOutDir: true,
        target: 'esnext', // Support top-level await
        rollupOptions: {
            input: {
                main: path.join(__dirname, 'src/renderer/index.html')
            }
        }
    },
    resolve: {
        alias: {
            '@': path.join(__dirname, 'src/renderer')
        }
    }
});
