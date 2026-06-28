import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'pages/about.html'),
        contact: resolve(__dirname, 'pages/contact.html'),
        forgot: resolve(__dirname, 'pages/auth/forgot.html'),
        login: resolve(__dirname, 'pages/auth/login.html'),
        register: resolve(__dirname, 'pages/auth/register.html'),
        admin: resolve(__dirname, 'pages/dashboard/admin.html'),
        organizer: resolve(__dirname, 'pages/dashboard/organizer.html'),
        user: resolve(__dirname, 'pages/dashboard/user.html'),
        news: resolve(__dirname, 'pages/news.html')
      }
    }
  }
});
