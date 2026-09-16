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
// Function to send push notification to customer
async function sendOrderPushNotification(orderId, status, customerId = null, customerName = null) {
    try {
        const supabaseUrl = 'https://bulprhgwuwatzobiojwz.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bHByaGd3dXdhdHpvYmlvand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDczNDksImV4cCI6MjA5MjA4MzM0OX0.2fcHrGX7iXw5G9nGRNkBy70W1Ex_om1C0v3qbryPmvw';
        
        // Get the order details
        const orders = await getOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            console.warn('⚠️ Order not found:', orderId);
            return false;
        }
        
        // Determine customer ID (if not provided, try to find from order)
        let targetUserId = customerId;
        if (!targetUserId) {
            // Try to find the customer by phone or email
            const customers = await getCustomers();
            const customer = customers.find(c => 
                c.phone === order.phone || 
                (c.email && order.email && c.email.toLowerCase() === order.email.toLowerCase())
            );
            if (customer) {
                targetUserId = customer.id;
                console.log('📍 Found customer ID:', targetUserId);
            } else {
                // Use guest identifier
                targetUserId = 'user_guest_' + order.phone.replace(/\D/g, '');
            }
        }
        
        // Prepare notification message based on status
        const statusMessages = {
            confirmed: {
                title: '✅ Order Confirmed!',
                body: `Your order #${orderId} has been confirmed. We'll notify you when it's being processed.`,
                url: `/orders/?order=${orderId}`
            },
            processing: {
                title: '🔄 Order Being Processed!',
                body: `Your order #${orderId} is now being processed. We'll ship it soon!`,
                url: `/orders/?order=${orderId}`
            },
            completed: {
                title: '📦 Order Completed!',
                body: `Your order #${orderId} has been completed. Thank you for shopping with us!`,
                url: `/orders/?order=${orderId}`
            },
            cancelled: {
                title: '❌ Order Cancelled',
                body: `Your order #${orderId} has been cancelled. If you have questions, please contact us.`,
                url: `/orders/?order=${orderId}`
            }
        };
        
        const message = statusMessages[status];
        if (!message) {
            console.warn('⚠️ Unknown status:', status);
            return false;
        }
        
        console.log('📤 Sending push notification to:', targetUserId);
        console.log('📤 Message:', message);
        
        // Send notification via Supabase Edge Function
        const response = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({
                targetUserId: targetUserId,
                title: message.title,
                body: message.body,
                data: {
                    url: `/orders/?order=${orderId}`,
                    orderId: orderId,
                    status: status
                }
            })
        });
        
        // Check if response is OK
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            console.error('❌ Server error:', errorData);
            
            // Don't show error toast for "no subscription" - it's not a critical error
            if (errorData.error && errorData.error.includes('No active push subscription')) {
                console.log('ℹ️ User has no push subscription - this is normal if they haven\'t enabled notifications');
                return false;
            }
            
            showToast(`⚠️ Failed to send notification: ${errorData.error || 'Server error'}`);
            return false;
        }
        
        const result = await response.json();
        console.log(`📤 Order notification sent for #${orderId}:`, result);
        
        // Handle the new response format from the edge function
        if (result.success) {
            // Successfully sent at least one notification
            const sentMsg = result.sent > 0 ? `(${result.sent}/${result.total} delivered)` : '';
            const deletedMsg = result.deleted > 0 ? ` (${result.deleted} expired subscriptions cleaned up)` : '';
            showToast(`📱 Notification sent to customer for order #${orderId} ${sentMsg}${deletedMsg}`);
            return true;
        } else {
            // Failed to send any notifications
            const errorMsg = result.error || 'Unknown error';
            if (errorMsg.includes('No active push subscription')) {
                // This is normal, don't show error toast
                console.log('ℹ️ No active push subscription for this user');
            } else {
                showToast(`⚠️ Failed to send notification: ${errorMsg}`);
            }
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error sending order notification:', error);
        // Don't show toast for network errors - they're noisy
        return false;
    }
}

// Expose to window
window.sendOrderPushNotification = sendOrderPushNotification;