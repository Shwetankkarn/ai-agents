import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],

    server: {
        proxy: {
            '/chat': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },

            '/conversation': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },

            '/conversations': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },

            '/test-auth': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
})