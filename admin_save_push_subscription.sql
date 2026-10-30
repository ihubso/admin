CREATE OR REPLACE FUNCTION public.admin_save_push_subscription(p_subscription jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user_id public.push_subscriptions.user_id%TYPE := auth.uid()::text;
    v_endpoint text;
    v_existing_id public.push_subscriptions.id%TYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication is required';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.admin_me()) THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;

    IF pg_catalog.jsonb_typeof(p_subscription) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION 'A valid push subscription is required';
    END IF;

    v_endpoint := p_subscription ->> 'endpoint';
    IF v_endpoint IS NULL
        OR v_endpoint NOT LIKE 'https://%'
        OR pg_catalog.jsonb_typeof(p_subscription -> 'keys') IS DISTINCT FROM 'object'
        OR coalesce(p_subscription #>> '{keys,p256dh}', '') = ''
        OR coalesce(p_subscription #>> '{keys,auth}', '') = '' THEN
        RAISE EXCEPTION 'The push subscription is incomplete or invalid';
    END IF;

    SELECT id
      INTO v_existing_id
      FROM public.push_subscriptions
     WHERE user_id = v_user_id
       AND endpoint = v_endpoint
     LIMIT 1;

    IF v_existing_id IS NULL THEN
        INSERT INTO public.push_subscriptions (user_id, subscription, endpoint)
        VALUES (v_user_id, p_subscription, v_endpoint);
    ELSE
        UPDATE public.push_subscriptions
           SET subscription = p_subscription,
               updated_at = pg_catalog.now()
         WHERE id = v_existing_id;
    END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_save_push_subscription(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_push_subscription(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_has_push_subscription()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user_id public.push_subscriptions.user_id%TYPE := auth.uid()::text;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication is required';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.admin_me()) THEN
        RAISE EXCEPTION 'Admin access is required';
    END IF;

    RETURN EXISTS (
        SELECT 1
          FROM public.push_subscriptions
         WHERE user_id = v_user_id
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_has_push_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_has_push_subscription() TO authenticated;
