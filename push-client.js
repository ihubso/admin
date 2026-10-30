// Browser-side Web Push registration. The private VAPID key never belongs here.
(function () {
    const VAPID_PUBLIC_KEY = 'BI-tM9VQcqAeco67R9VhA9TxByJyFjPgcMcqS_dhfOsve-BcVA5G_0fQIK9uVcECs_sbqnUGWOa1t5kFs-94FRg';

    function base64ToUint8Array(value) {
        const padding = '='.repeat((4 - value.length % 4) % 4);
        const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        return Uint8Array.from([...rawData].map(character => character.charCodeAt(0)));
    }

    async function registerPushSubscription(supabaseClient) {
        if (!supabaseClient) throw new Error('Supabase is not available');
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error('Push notifications are not supported by this browser');
        }
        if (!window.isSecureContext) {
            throw new Error('Push notifications require HTTPS or localhost');
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Notification permission was not granted');
        }

        await navigator.serviceWorker.register('/sw.js');
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        const subscriptionJson = subscription.toJSON();
        const { error: saveError } = await supabaseClient.rpc('admin_save_push_subscription', {
            p_subscription: subscriptionJson
        });
        if (saveError) throw saveError;
        return subscriptionJson;
    }

    window.registerPushSubscription = registerPushSubscription;
    window.registerAdminPush = function (supabaseClient) {
        return registerPushSubscription(supabaseClient);
    };
})();
