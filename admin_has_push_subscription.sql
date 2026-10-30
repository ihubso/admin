CREATE OR REPLACE FUNCTION public.admin_has_push_subscription(p_endpoint text)
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

    IF p_endpoint IS NULL OR p_endpoint = '' THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1
          FROM public.push_subscriptions
         WHERE user_id = v_user_id
           AND endpoint = p_endpoint
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_has_push_subscription(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_has_push_subscription(text) TO authenticated;
