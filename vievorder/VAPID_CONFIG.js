// VAPID_CONFIG.js - Updated with proper keys
const VAPID_CONFIG = {
    // This is your VAPID public key - keep this visible
    publicKey: 'BI-tM9VQcqAeco67R9VhA9TxByJyFjPgcMcqS_dhfOsve-BcVA5G_0fQIK9uVcECs_sbqnUGWOa1t5kFs-94FRg',
    
    // NEVER expose private key in client-side code!
    // This should only be used on the server
    privateKey: 'Y0tevI6hf8uyKQr1rqOzXjTOGTBKT4Fz_VV9jnYrlOs',
    
    // Your contact email for the notification service
    email: 'austinlebechi02@gmail.com',
    
    // Supabase configuration
    supabase: {
        url: 'https://bulprhgwuwatzobiojwz.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bHByaGd3dXdhdHpvYmlvand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDczNDksImV4cCI6MjA5MjA4MzM0OX0.2fcHrGX7iXw5G9nGRNkBy70W1Ex_om1C0v3qbryPmvw'
    }
};