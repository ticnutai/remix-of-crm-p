-- ייבוא רישומי זמן מגיבוי
-- נוצר אוטומטית ב-2026-01-27T20:23:18.238Z
-- הרץ אחרי ייבוא הלקוחות!

DO $$
DECLARE
    v_user_id UUID;
    v_client_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'אין משתמשים במערכת';
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2029-12-15T09:00:00Z'::timestamptz, '2029-12-15T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69543ed2b9ce82d53668411a","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2029-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2025-12-30T19:06:26.505Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e0df86992056105c86' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן - טיפול בפקער', '2026-01-27T09:00:00Z'::timestamptz, '2026-01-27T09:22:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69788a24f9558c31c75b0617","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-27T07:49:24.821Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e441dbf02e234dd99f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-27T09:00:00Z'::timestamptz, '2026-01-27T09:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"697898f6ed40d71ef1b7c87f","original_client_name":"גופין","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-27T08:52:38.266Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4970ee9e62bb09fd1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות ביצוע', '2026-01-22T09:00:00Z'::timestamptz, '2026-01-22T09:36:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6972211aac7dbbbb67784a01","original_client_name":"גבעוני","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-22T11:07:38.268Z');
    END IF;

    -- לוג עבור: פלס מנדי וחיינא 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db5dc55befd95dd22f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-22T09:00:00Z'::timestamptz, '2026-01-22T11:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6972187c323c5d6fb28a92cf","original_client_name":"פלס מנדי וחיינא 58","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-22T10:30:52.962Z');
    END IF;

    -- לוג עבור: לייכטר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8fcb8bffb5c929c4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'סקיצות', '2026-01-22T09:00:00Z'::timestamptz, '2026-01-22T09:58:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6971f7edf1a3dff9dec39efe","original_client_name":"לייכטר","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-22T08:11:57.310Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4970ee9e62bb09fd1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'קונסטרוקציה', '2026-01-21T09:00:00Z'::timestamptz, '2026-01-21T11:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6970c9a532fdf957065db27a","original_client_name":"גבעוני","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-21T10:42:13.498Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגשת תכן חוזרת', '2026-01-21T09:00:00Z'::timestamptz, '2026-01-21T09:22:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6970a8b6a6c9894d1e66ee09","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-21T08:21:42.227Z');
    END IF;

    -- לוג עבור: לייכטר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8fcb8bffb5c929c4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עיבוד סקיצה', '2026-01-21T09:00:00Z'::timestamptz, '2026-01-21T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6970a345882a2d0497c6051b","original_client_name":"לייכטר","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-21T07:58:29.125Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-21T09:00:00Z'::timestamptz, '2026-01-21T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"697091e1bce57c1d0fd1a2a1","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-21T06:44:17.230Z');
    END IF;

    -- לוג עבור: לייכטר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8fcb8bffb5c929c4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עיבוד סקיצה 1', '2026-01-21T09:00:00Z'::timestamptz, '2026-01-21T09:58:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69708fdf5e5a0a781bf192af","original_client_name":"לייכטר","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-21T06:35:43.904Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d7ffdcb524bd904fe8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2026-01-18T09:00:00Z'::timestamptz, '2026-01-18T09:39:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"696ca1bd002cfb08e615ba77","original_client_name":"כפלין-גדז''","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-18T07:02:53.734Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e0df86992056105c86' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2026-01-15T09:00:00Z'::timestamptz, '2026-01-16T02:01:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6968e8e1a35e5965aeb61148","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.238Z"}'::jsonb, '2026-01-15T11:17:21.295Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-14T09:00:00Z'::timestamptz, '2026-01-14T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"696746440c12e6a9eb6654f6","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-14T05:31:16.668Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-14T09:00:00Z'::timestamptz, '2026-01-14T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69674643b7370371ed4b92d7","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-14T05:31:15.949Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-14T09:00:00Z'::timestamptz, '2026-01-14T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69674644d126065c2dcb928d","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-14T05:31:16.269Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-13T09:00:00Z'::timestamptz, '2026-01-13T09:51:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6966035cbb95dfc8cbc5a048","original_client_name":"בדני רונן","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-13","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-13T06:33:32.690Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-13T09:00:00Z'::timestamptz, '2026-01-13T09:18:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6965f729258d2e91e90bfb67","original_client_name":"זייגן קטן","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-13","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-13T05:41:29.742Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגשת פרסום', '2026-01-13T09:00:00Z'::timestamptz, '2026-01-13T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6965f2be346f589893c07287","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-13","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-13T05:22:38.432Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'טיפול בפירסום', '2026-01-13T09:00:00Z'::timestamptz, '2026-01-13T09:06:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6965edae0241bc156e70ba97","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-13","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-13T05:01:02.688Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e12da103a0e62fb4b8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בדיקת גדרות', '2026-01-12T09:00:00Z'::timestamptz, '2026-01-12T09:16:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6964f1318299213f96ed8d09","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-12T11:03:45.896Z');
    END IF;

    -- לוג עבור: רסקין וישצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d89edaff28ff235b8a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא - תיקונים להכהן ורסקין', '2026-01-12T09:00:00Z'::timestamptz, '2026-01-12T14:39:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6964ed2ebe7f9768e5e4738f","original_client_name":"רסקין וישצקי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-12T10:46:38.328Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4970ee9e62bb09fd1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכניות עבודה - שיחה עם מעצבת +בירור מול נחשון ', '2026-01-12T09:00:00Z'::timestamptz, '2026-01-12T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6964c013cfb215ef405b8e68","original_client_name":"גבעוני","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-12T07:34:11.644Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e0df86992056105c86' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-08T09:00:00Z'::timestamptz, '2026-01-08T10:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695f72f26064a6ff2d0572d6","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-08T07:03:46.796Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e441dbf02e234dd99f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-08T09:00:00Z'::timestamptz, '2026-01-08T09:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695f62adbfbd0bd374b022f8","original_client_name":"גופין","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-08T05:54:21.303Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e0df86992056105c86' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן - טיפול בממד', '2026-01-08T09:00:00Z'::timestamptz, '2026-01-08T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695fab051bffb5bb8130e25b","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-08T11:03:01.470Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e003eb2b56fa5ac2ed' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2026-01-08T09:00:00Z'::timestamptz, '2026-01-08T11:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695fa3d38230e92f78501d25","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-08T10:32:19.444Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e003eb2b56fa5ac2ed' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכנון - בדיקת חזיתות ותוכניות והערות לתיקון', '2026-01-07T09:00:00Z'::timestamptz, '2026-01-07T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695e27da30af9ef08b1d59d8","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"68b1cbb978d968c9b5f758d1","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-07T07:31:06.593Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e0df86992056105c86' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-07T09:00:00Z'::timestamptz, '2026-01-07T09:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695e0680d7f3ff62ebc6710b","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-07T05:08:48.525Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e0df86992056105c86' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-06T09:00:00Z'::timestamptz, '2026-01-06T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695cfe24d9c6ab456f9d6a3f","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-06T10:20:52.588Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-06T09:00:00Z'::timestamptz, '2026-01-06T09:59:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695cfda54829f3b8437cd1fd","original_client_name":"בדני רונן","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-06T10:18:45.122Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e0df86992056105c86' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - התייחסות למהנדס', '2026-01-06T09:00:00Z'::timestamptz, '2026-01-06T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695cf7f2169b51164433ad89","original_client_name":"פלדמן יוסי","original_created_by_id":"68b1cbb978d968c9b5f758d1","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-06T09:54:26.902Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2026-01-06T09:00:00Z'::timestamptz, '2026-01-06T09:54:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695cd4f9de5a736d0523eee7","original_client_name":"זייגן קטן","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-06T07:25:13.555Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e0df86992056105c86' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - עדכון ממד שני לפי הנחיות יועץ מיגון ', '2026-01-06T09:00:00Z'::timestamptz, '2026-01-06T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695ccbf89e973692a02709bb","original_client_name":"פלדמן יוסי","original_created_by_id":"68b1cbb978d968c9b5f758d1","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-06T06:46:48.641Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e12da103a0e62fb4b8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עיצוב פנים - שליחה לספקים לה.מחיר', '2026-01-06T09:00:00Z'::timestamptz, '2026-01-06T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695cc9c5cc7cdba663a3709a","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68b1cbb978d968c9b5f758d1","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-06T06:37:25.122Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-06T09:00:00Z'::timestamptz, '2026-01-06T09:03:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695cc78bee6c438f91ce40b3","original_client_name":"זייגן קטן","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-06T06:27:55.685Z');
    END IF;

    -- לוג עבור: סטמבלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db69bffd197efb66d3' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-06T09:00:00Z'::timestamptz, '2026-01-06T09:58:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695cc6bcd68458c506aab83d","original_client_name":"סטמבלר","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-06T06:24:28.621Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עם קבלת היתר - הסבר ללקוח ומענה לשאלות ', '2026-01-05T09:00:00Z'::timestamptz, '2026-01-05T09:36:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695b9297b1a6823dfec0432a","original_client_name":"ברוד","original_created_by_id":"68b1cbb978d968c9b5f758d1","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-05T08:29:43.900Z');
    END IF;

    -- לוג עבור: דוברסקין מנדי וחיה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3bf5096b9055bc353' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פיקוח - מענה לשאלות/שינויים  תוך כדי עבודה ', '2026-01-05T09:00:00Z'::timestamptz, '2026-01-05T09:07:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695b86a4f94490293ce13b51","original_client_name":"דוברסקין מנדי וחיה","original_created_by_id":"68b1cbb978d968c9b5f758d1","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-05T07:38:44.993Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקון', '2026-01-02T09:00:00Z'::timestamptz, '2026-01-02T10:29:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fb0814c047418705749a","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-01T20:54:00.993Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'זום ותיקוני גרמושא', '2026-01-01T09:00:00Z'::timestamptz, '2026-01-01T13:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695670651ec1ff08f57300db","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-01T11:02:29.968Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d7ffdcb524bd904fe8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2026-01-01T09:00:00Z'::timestamptz, '2026-01-01T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69565c0976bbb9cd5b6322b8","original_client_name":"כפלין-גדז''","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-01T09:35:37.959Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות ביצוע', '2026-01-01T09:00:00Z'::timestamptz, '2026-01-01T10:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69564c8ab6bef02c23c72ede","original_client_name":"שטראוס","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-01T08:29:30.248Z');
    END IF;

    -- לוג עבור: סטמבלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db69bffd197efb66d3' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2026-01-01T09:00:00Z'::timestamptz, '2026-01-01T10:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69564c5feffbe649c064ff20","original_client_name":"סטמבלר","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-01T08:28:47.270Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בדיקת עמודים', '2026-01-01T09:00:00Z'::timestamptz, '2026-01-01T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69559f92851caf51f45340f5","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T20:11:30.601Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2026-01-01T09:00:00Z'::timestamptz, '2026-01-01T13:23:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695681e918502954181ae84c","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-01T12:17:13.891Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הולצמן - תיכנון יחי'' ארגון הקובץ', '2026-01-01T09:00:00Z'::timestamptz, '2026-01-01T11:21:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956cb5c25c3821e89620824","original_client_name":"שטראוס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-01T17:30:36.746Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2026-01-01T09:00:00Z'::timestamptz, '2026-01-01T10:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69565c1aa64992fc77f8065a","original_client_name":"בדני רונן","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2026-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2026-01-01T09:35:54.518Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4970ee9e62bb09fd1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T10:58:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695527184e9b106acacca192","original_client_name":"גבעוני","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T11:37:28.021Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות ביצוע', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T11:41:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69550a70f86fedfd33a3a080","original_client_name":"שטראוס","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T09:35:12.234Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T11:47:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553793e7390b0b7e52c612","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T12:47:47.623Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e0df86992056105c86' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - שיחה עם יועצת מיגון ועדכון ממד לפי הנחיות (לא סיימתי )', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T10:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69559d51b1de2b0948368542","original_client_name":"פלדמן יוסי","original_created_by_id":"68b1cbb978d968c9b5f758d1","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T20:01:53.668Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T13:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69555173972a42cfcd185148","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T14:38:11.688Z');
    END IF;

    -- לוג עבור: ויינפלד שלמה -תבע
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e2bd68f75fee00b7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695586e5dc8623047abaf6ef","original_client_name":"ויינפלד שלמה -תבע","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T18:26:13.245Z');
    END IF;

    -- לוג עבור: סלפושניק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbcd803cc80e322502' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגשת הבקשה ברישוי זמין', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557f14a990014e07bea4a7","original_client_name":"סלפושניק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T17:52:52.222Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T09:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954cc78f91416273273b1fd","original_client_name":"שטראוס","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T05:10:48.697Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T09:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954d76420acd58681d6e2ea","original_client_name":"שטראוס","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T05:57:24.031Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d7ffdcb524bd904fe8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T09:36:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954e4711dd8fe8ef07b9e3c","original_client_name":"כפלין-גדז''","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T06:53:05.535Z');
    END IF;

    -- לוג עבור: פויזנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbba7f08f150831fb6' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-31T09:00:00Z'::timestamptz, '2025-12-31T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69555297e0dec662afc686ce","original_client_name":"פויזנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-31T14:43:03.777Z');
    END IF;

    -- לוג עבור: רסקין וישצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d89edaff28ff235b8a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:23:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695391ab816d2401938abfc6","original_client_name":"רסקין וישצקי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T06:47:39.508Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T13:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695426b3f8c463897908e1bb","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T17:23:31.410Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגשת תכן', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953a003643aadf851afa072","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T07:48:51.261Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4970ee9e62bb09fd1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:19:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953ab8cd02c607913a97180","original_client_name":"גבעוני","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T08:38:04.035Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:26:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953b503e9aabbdb58c6305a","original_client_name":"זייגן קטן","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T09:18:27.084Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T11:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c674e3765f2d750bf375","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T10:32:52.509Z');
    END IF;

    -- לוג עבור: סטמבלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db69bffd197efb66d3' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953ce0d3f3aecbccf730113","original_client_name":"סטמבלר","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T11:05:17.444Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e003eb2b56fa5ac2ed' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T13:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953ce438f49ab48908a7601","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T11:06:11.032Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695404eb39fac79001ecf09d","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T14:59:23.360Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69542656cc7d08610ae1f591","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T17:21:58.268Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכניות עבודה - בקרה ', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T10:39:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69543d8b637672fad4ecbcb3","original_client_name":"שטראוס","original_created_by_id":"68b1cbb978d968c9b5f758d1","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T19:00:59.600Z');
    END IF;

    -- לוג עבור: רסקין וישצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d89edaff28ff235b8a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:23:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695391aae47c38a4357850f4","original_client_name":"רסקין וישצקי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T06:47:38.612Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4970ee9e62bb09fd1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T10:27:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69538c06dcbeb642eacb4676","original_client_name":"גבעוני","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T06:23:34.556Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695445b2152b9438a4899915","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T19:35:46.113Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T12:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695445da79b63a01d1f647b6","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T19:36:26.387Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd4352a8d538799988' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T10:32:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954460a26af37205980f7a3","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.239Z"}'::jsonb, '2025-12-30T19:37:14.200Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695446c03877d78851aa6fb3","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:40:16.414Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:49:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695446e45f821d7d259349bb","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:40:52.328Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e79f34b26e38077500' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954470537e7e80a029efb57","original_client_name":"אחיאלי עופר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:41:25.934Z');
    END IF;

    -- לוג עבור: פויזנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbba7f08f150831fb6' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T12:51:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954472be9f991fbb533fef0","original_client_name":"פויזנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:42:03.892Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T10:52:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954474e8bc7e8a7993ad020","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:42:38.156Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T11:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695441d77797f9526c531fd5","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:19:19.825Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695445185555fbe237889bdd","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:33:12.018Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T12:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695444ef05d458fee931ff34","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:32:31.998Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T11:47:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695444bc0fd87b18003957f0","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:31:40.453Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69544490f7b444a16b12e359","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:30:56.337Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T16:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954446d9104aad1136336be","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:30:21.899Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69544436e23c8c1826202608","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:29:26.842Z');
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:56:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954440a6ba672ab61931c5b","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:28:42.341Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:56:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695443e48b00131e70a8cf61","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:28:04.046Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e12da103a0e62fb4b8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69544382a507e8d702eb8dce","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:26:26.679Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T13:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695443605917257bfa7a6b89","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:25:52.079Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T13:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954432b23746feb9eed83a8","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:24:59.857Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69544291ed36a6dd93f716d3","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:22:25.649Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T10:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954274e072e80aa8be206c4","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T17:26:06.729Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T18:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954419d5f2e9dd6006bbd4a","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:18:21.306Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T13:51:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954416efc20e2ebd84971e8","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:17:34.828Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T12:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69544116919fff28ce255706","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:16:06.105Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954456d9ef88a224ae4356c","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:34:37.670Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69543f0529c47b818fadf715","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:07:17.941Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954458f5a8d7884369201a6","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:35:11.540Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69543e94bf677ca47c068347","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:05:24.431Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69543e370334d3bf60711ff0","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:03:51.072Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T10:07:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69543e04bf677ca47c0682f1","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:03:00.848Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T13:24:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69543d9e76bcc3495592c9a1","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:01:18.441Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T10:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954454cb576a03ba81638b3","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:34:04.041Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-30T09:00:00Z'::timestamptz, '2025-12-30T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69543d6a89f0f36200f06adf","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-30T19:00:26.423Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e0df86992056105c86' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן - פקער', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T09:17:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695266b073f5af915347f2f2","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T09:32:00.672Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e003eb2b56fa5ac2ed' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T09:44:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6952822aa69b09b42aeb057e","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T11:29:14.473Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T09:13:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6952778e1e84d5ca6e1d68fd","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T10:43:58.799Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e441dbf02e234dd99f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T09:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6952745eae941d2f88e58a8e","original_client_name":"גופין","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T10:30:22.830Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4970ee9e62bb09fd1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T09:04:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695225839c76b878ab23815b","original_client_name":"גבעוני","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T04:53:55.360Z');
    END IF;

    -- לוג עבור: קרישבסקי יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da149c38dda90d3325' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T09:47:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b77a6d38b67726608247","original_client_name":"קרישבסקי יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-28T21:04:26.672Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb853bc318b4c975003' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b4b2cab4489a8dda25e8","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-28T20:52:34.900Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T09:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b1eb755ce453369b2e0c","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-28T20:40:43.385Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e003eb2b56fa5ac2ed' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T10:57:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69526070fa1c48b250946934","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T09:05:20.283Z');
    END IF;

    -- לוג עבור: רסקין וישצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d89edaff28ff235b8a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T11:06:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695244b754905099e1ee7094","original_client_name":"רסקין וישצקי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T07:07:03.755Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e003eb2b56fa5ac2ed' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695225ca8f28198f667daaa0","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T04:55:06.046Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שליחת תכנית ללקוח', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6952627427449ba784e09874","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T09:13:56.830Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4970ee9e62bb09fd1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בדיקת תשלום', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695268cbcee27ca101ad00f0","original_client_name":"גבעוני","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T09:40:59.188Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e441dbf02e234dd99f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-29T09:00:00Z'::timestamptz, '2025-12-29T09:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6952745e0cf56d55c880d46d","original_client_name":"גופין","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T10:30:22.648Z');
    END IF;

    -- לוג עבור: רסקין וישצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d89edaff28ff235b8a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2025-12-28T09:00:00Z'::timestamptz, '2025-12-28T10:51:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69511c412ae425116c7b761d","original_client_name":"רסקין וישצקי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-28T10:02:09.417Z');
    END IF;

    -- לוג עבור: וישצקי שמואל ופנחס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d7ba7f08f150831fb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-28T09:00:00Z'::timestamptz, '2025-12-28T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69513dd00efde5b374ce75f9","original_client_name":"וישצקי שמואל ופנחס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-28T12:25:20.645Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-28T09:00:00Z'::timestamptz, '2025-12-28T09:12:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695145a8853c80677154d08c","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-28T12:58:48.601Z');
    END IF;

    -- לוג עבור: סטמבלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db69bffd197efb66d3' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-28T09:00:00Z'::timestamptz, '2025-12-28T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695225fbd002bb8ccd729c9e","original_client_name":"סטמבלר","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T04:55:55.906Z');
    END IF;

    -- לוג עבור: רסקין וישצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d89edaff28ff235b8a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-28T09:00:00Z'::timestamptz, '2025-12-28T14:13:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695225ac351e06b6da797ad8","original_client_name":"רסקין וישצקי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-29T04:54:36.169Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-23T09:00:00Z'::timestamptz, '2025-12-23T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694a7dab67f3b04c2849b7aa","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-23T09:31:55.132Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן - טיפול בפקע"ר', '2025-12-23T09:00:00Z'::timestamptz, '2025-12-23T10:29:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694a7c33b4d9f1064466dc97","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-23T09:25:39.979Z');
    END IF;

    -- לוג עבור: גדז' אבי-מיכאל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec6874c194a0c7249128' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא  - בדיקת גרמושקא +עיבודים אחרונים ', '2025-12-22T09:00:00Z'::timestamptz, '2025-12-22T11:52:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69497dc69b1d886ba8e73288","original_client_name":"גדז'' אבי-מיכאל","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.240Z"}'::jsonb, '2025-12-22T15:20:06.227Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba4f6e8cee603818921' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-21T09:00:00Z'::timestamptz, '2025-12-21T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69482403ef3e2ea1a3491f1a","original_client_name":"אהרונסון","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-21T14:44:51.540Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba4f6e8cee603818921' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-20T09:00:00Z'::timestamptz, '2025-12-20T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6947261902ee928f52309731","original_client_name":"אהרונסון","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-20T20:41:29.150Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון פרויקט', '2025-12-18T09:00:00Z'::timestamptz, '2025-12-18T09:17:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6943fb5d3bcba275b979a995","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-18T11:02:21.348Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee960bd3c6c25a3ac4b92' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכון ממעצב בתכניות ביצוע', '2025-12-18T09:00:00Z'::timestamptz, '2025-12-18T10:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6943f70cc86cf14e6063f7bf","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-18T10:43:56.053Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון פרויקט', '2025-12-18T09:00:00Z'::timestamptz, '2025-12-18T09:17:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6943fb52c3d14472ad2fb264","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-18T11:02:10.849Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון פרויקט', '2025-12-18T09:00:00Z'::timestamptz, '2025-12-18T09:17:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6943fb5700231d307973ab9e","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-18T11:02:15.293Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון פרויקט', '2025-12-18T09:00:00Z'::timestamptz, '2025-12-18T09:17:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6943fb597d22c61eaa31efcf","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-18T11:02:17.046Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-17T09:00:00Z'::timestamptz, '2025-12-17T12:23:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6942bff12824c0bbd010eb0b","original_client_name":"כפלין-גדז''","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-17T12:36:33.470Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-17T09:00:00Z'::timestamptz, '2025-12-17T10:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694300ba797bc9e49b231187","original_client_name":"כפלין-גדז''","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-17T17:12:58.072Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb08b3023731f2013be' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'דרישות תכן', '2025-12-17T09:00:00Z'::timestamptz, '2025-12-17T09:28:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69430809389190e169f2ee2a","original_client_name":"גופין","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-17T17:44:09.531Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-16T09:00:00Z'::timestamptz, '2025-12-16T11:53:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69416b6229c7f53842d71983","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-16T12:23:30.502Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-16T09:00:00Z'::timestamptz, '2025-12-16T09:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69416dc356906fa6056dbe2a","original_client_name":"כפלין-גדז''","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-16T12:33:39.406Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-16T09:00:00Z'::timestamptz, '2025-12-16T11:27:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6941cb5adf8cce215d55eab9","original_client_name":"כפלין-גדז''","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-16T19:12:58.672Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-16T09:00:00Z'::timestamptz, '2025-12-16T11:27:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6941cb5a961e8495f06ef3ae","original_client_name":"כפלין-גדז''","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.241Z"}'::jsonb, '2025-12-16T19:12:58.833Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-15T09:00:00Z'::timestamptz, '2025-12-15T11:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694010168d291e5011527067","original_client_name":"כפלין-גדז''","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-15T11:41:42.296Z');
    END IF;

    -- לוג עבור: רבינוביץ יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee960bd3c6c25a3ac4b8c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-15T09:00:00Z'::timestamptz, '2025-12-15T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69409c41fbb4c7b89057a98d","original_client_name":"רבינוביץ יוסי","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-15T21:39:45.152Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פגישת תכנון - עדכון למטבח ', '2025-12-15T09:00:00Z'::timestamptz, '2025-12-15T09:56:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694029358e1023e8e8a68343","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-15T13:28:53.286Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכן', '2025-12-15T09:00:00Z'::timestamptz, '2025-12-15T09:43:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69401a7dd022db8c8a1b7885","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-15T12:26:05.415Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-15T09:00:00Z'::timestamptz, '2025-12-15T11:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69401016e8d6b8ed4ca5559a","original_client_name":"כפלין-גדז''","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-15T11:41:42.269Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פגישת תכנון - עדכון למטבח ', '2025-12-15T09:00:00Z'::timestamptz, '2025-12-15T09:56:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713e9a8ce7eff5486d49d","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:53.847Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכן', '2025-12-15T09:00:00Z'::timestamptz, '2025-12-15T09:43:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ea7920f5d2daf8f54d","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:54.039Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-15T09:00:00Z'::timestamptz, '2025-12-15T11:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713eafcd9c70f9e8460f2","original_client_name":"כפלין-גדז''","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:54.259Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-15T09:00:00Z'::timestamptz, '2025-12-15T11:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ea7d7b248feaf1fbf4","original_client_name":"כפלין-גדז''","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:54.458Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-14T09:00:00Z'::timestamptz, '2025-12-14T13:07:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713eb1fee6dda36e88115","original_client_name":"כפלין-גדז''","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:55.172Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים תכנית ביצוע', '2025-12-14T09:00:00Z'::timestamptz, '2025-12-14T10:58:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693ebd40d824d2868f696f5e","original_client_name":"גבעוני","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-14T11:36:00.101Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'ה.מחיר ומענה ללקוח', '2025-12-14T09:00:00Z'::timestamptz, '2025-12-14T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693ea7a57e7a70d49e23196c","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-14T10:03:49.430Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכניות עבודה - ביקורת והנחיה על תוכניות עבודה ', '2025-12-14T09:00:00Z'::timestamptz, '2025-12-14T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693ea74399f4f84ef1dc5cca","original_client_name":"גבעוני","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-14T10:02:11.626Z');
    END IF;

    -- לוג עבור: כפלין-גדז'
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec793a87a563f8c6476a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2025-12-14T09:00:00Z'::timestamptz, '2025-12-14T13:07:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693ea16217e0754a848eb7ab","original_client_name":"כפלין-גדז''","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-14T09:37:06.240Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-14T09:00:00Z'::timestamptz, '2025-12-14T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951afadb6caeff65724ee76","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-28T20:31:09.875Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים תכנית ביצוע', '2025-12-14T09:00:00Z'::timestamptz, '2025-12-14T10:58:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ea2ad56d50d66e8b9b","original_client_name":"גבעוני","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:54.655Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'ה.מחיר ומענה ללקוח', '2025-12-14T09:00:00Z'::timestamptz, '2025-12-14T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ea2defb11f177b220c","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:54.830Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכניות עבודה - ביקורת והנחיה על תוכניות עבודה ', '2025-12-14T09:00:00Z'::timestamptz, '2025-12-14T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ea8702011e543fd938","original_client_name":"גבעוני","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:54.992Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות ביצוע', '2025-12-10T09:00:00Z'::timestamptz, '2025-12-10T12:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713eecffe7b8496179cd5","original_client_name":"גבעוני","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:58.569Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb08b3023731f2013be' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכון - בקרה מרחבית', '2025-12-10T09:00:00Z'::timestamptz, '2025-12-10T10:52:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713eecd803cc80e322511","original_client_name":"גופין","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:58.320Z');
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-10T09:00:00Z'::timestamptz, '2025-12-10T09:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951af15e4af06735a0400ed","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-28T20:28:37.250Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb08b3023731f2013be' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכון - בקרה מרחבית', '2025-12-10T09:00:00Z'::timestamptz, '2025-12-10T10:52:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693950fa6403bd8ae5dc28e3","original_client_name":"גופין","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-10T08:52:42.423Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות ביצוע', '2025-12-10T09:00:00Z'::timestamptz, '2025-12-10T12:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69393670494a4e1a1f04f1a8","original_client_name":"גבעוני","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-10T06:59:28.039Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פיקוח-לאחר היתר - מענה ללקוח ', '2025-12-09T09:00:00Z'::timestamptz, '2025-12-09T09:22:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ee19145780f8a9ca35","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:58.986Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן - הגשה לפקע"ר', '2025-12-09T09:00:00Z'::timestamptz, '2025-12-09T10:02:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6937e5943f15d21f49815298","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-09T07:02:12.139Z');
    END IF;

    -- לוג עבור: דוברסקין מנדי וחיה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb3b3a51cdaf6045bc2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פיקוח-לאחר היתר - מענה ללקוח', '2025-12-09T09:00:00Z'::timestamptz, '2025-12-09T09:04:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69382c5185fe3bbf440fda17","original_client_name":"דוברסקין מנדי וחיה","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-09T12:04:01.048Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פיקוח-לאחר היתר - מענה ללקוח ', '2025-12-09T09:00:00Z'::timestamptz, '2025-12-09T09:22:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69384c642e951bea9dbf011c","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-09T14:20:52.156Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abaaab515193420103b9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - מענה ליועץ סניטרי ', '2025-12-09T09:00:00Z'::timestamptz, '2025-12-09T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693863b9cd82652225f11427","original_client_name":"בדני רונן","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-09T16:00:25.473Z');
    END IF;

    -- לוג עבור: קולא
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dcb77b12ed2336d8cb' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-09T09:00:00Z'::timestamptz, '2025-12-09T11:46:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951ae3665122fbe2ea341da","original_client_name":"קולא","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-28T20:24:54.939Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abaaab515193420103b9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - מענה ליועץ סניטרי ', '2025-12-09T09:00:00Z'::timestamptz, '2025-12-09T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ee6cc0d01cb54488e7","original_client_name":"בדני רונן","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:58.724Z');
    END IF;

    -- לוג עבור: דוברסקין מנדי וחיה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb3b3a51cdaf6045bc2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פיקוח-לאחר היתר - מענה ללקוח', '2025-12-09T09:00:00Z'::timestamptz, '2025-12-09T09:04:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ef0affe6c202f20d7d","original_client_name":"דוברסקין מנדי וחיה","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-20T19:23:59.154Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb08b3023731f2013be' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרה מרחבית', '2025-12-08T09:00:00Z'::timestamptz, '2025-12-08T09:16:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6936f7703911110421bad964","original_client_name":"גופין","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-08T14:06:08.627Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון פרויקט', '2025-12-08T09:00:00Z'::timestamptz, '2025-12-08T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69368349d56b3f2f3ba91149","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-08T05:50:33.690Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון פרויקט', '2025-12-08T09:00:00Z'::timestamptz, '2025-12-08T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69368349387084dd25c80a99","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-08T05:50:33.640Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb08b3023731f2013be' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת מרחבית', '2025-12-08T09:00:00Z'::timestamptz, '2025-12-08T09:32:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693682055781c8d9f128ce4f","original_client_name":"גופין","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-08T05:45:09.057Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-07T09:00:00Z'::timestamptz, '2025-12-07T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693527d071fe499f6ecf1f17","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-07T05:08:00.701Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-07T09:00:00Z'::timestamptz, '2025-12-07T12:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693556d0121115aba0f49a8d","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-07T08:28:32.702Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-07T09:00:00Z'::timestamptz, '2025-12-07T12:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693556d052ecbd64fa714e5a","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-07T08:28:32.655Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-07T09:00:00Z'::timestamptz, '2025-12-07T12:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693556d00e244fd50d63cebc","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-07T08:28:32.568Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-07T09:00:00Z'::timestamptz, '2025-12-07T12:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693556d01c549a2c0de1990d","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-07T08:28:32.188Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-07T09:00:00Z'::timestamptz, '2025-12-07T12:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693556d0efdb333fd669cce7","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-07T08:28:32.191Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-07T09:00:00Z'::timestamptz, '2025-12-07T12:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693556cfd3b9b2cfcb37b037","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-07T08:28:31.422Z');
    END IF;

    -- לוג עבור: גדז' אבי-מיכאל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec6874c194a0c7249128' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פגישת תכנון - מענה ללקוח', '2025-12-04T09:00:00Z'::timestamptz, '2025-12-04T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6931f707caf36777e5c9bc68","original_client_name":"גדז'' אבי-מיכאל","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-04T19:03:03.048Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פגישת תכנון - סיום עיבוד סקיצות לאישור לקוח+שליחה למעצבת', '2025-12-04T09:00:00Z'::timestamptz, '2025-12-04T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6931f221c0f94a5583ed29a5","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-04T18:42:09.024Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-12-04T09:00:00Z'::timestamptz, '2025-12-04T11:51:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6931f0dfc27de959305603ef","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-04T18:36:47.311Z');
    END IF;

    -- לוג עבור: דוברסקין מנדי וחיה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb3b3a51cdaf6045bc2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פיקוח-לאחר היתר - מענה ללקוח על שאלות', '2025-12-04T09:00:00Z'::timestamptz, '2025-12-04T09:14:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6931e2e4ae7f15ac1b11e385","original_client_name":"דוברסקין מנדי וחיה","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-04T17:37:08.642Z');
    END IF;

    -- לוג עבור: לייכטר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d02222f9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פגישת תכנון', '2025-12-03T09:00:00Z'::timestamptz, '2025-12-03T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6930b48289af3c01caa4d954","original_client_name":"לייכטר","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-03T20:06:58.827Z');
    END IF;

    -- לוג עבור: מינסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222306' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - מענה ללקוח ', '2025-12-03T09:00:00Z'::timestamptz, '2025-12-03T09:16:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692ffe85fece3eddeeaa49dc","original_client_name":"מינסקי","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-03T07:10:29.963Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון פרויקט', '2025-12-02T09:00:00Z'::timestamptz, '2025-12-02T12:34:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692f402d83d331ff00899d55","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-02T17:38:21.445Z');
    END IF;

    -- לוג עבור: קוזלובסקי נחמי ויהודה 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222328' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שינויים -לאחר היתר - מבקשים לעשות שינויים מהיתר . צריכים להחזיר תשובות', '2025-12-02T09:00:00Z'::timestamptz, '2025-12-02T09:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692f2d87c54b9b15001c6d9a","original_client_name":"קוזלובסקי נחמי ויהודה 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-02T16:18:47.328Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb08b3023731f2013be' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בקרה מרחבית', '2025-12-02T09:00:00Z'::timestamptz, '2025-12-02T09:21:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692ea8c56b0cfdd1a481a4c0","original_client_name":"גופין","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-02T06:52:21.560Z');
    END IF;

    -- לוג עבור: וישצקי שמואל ופנחס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68f72bb56f726d892d602fa9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'קידום תכן', '2025-12-02T09:00:00Z'::timestamptz, '2025-12-02T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692ea397b966ead9c3183d85","original_client_name":"וישצקי שמואל ופנחס","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-02T06:30:15.774Z');
    END IF;

    -- לוג עבור: וישצקי שמואל ופנחס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68f72bb56f726d892d602fa9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-12-02T09:00:00Z'::timestamptz, '2025-12-02T09:21:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692ea37e2f1c72660eb9aa9a","original_client_name":"וישצקי שמואל ופנחס","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-02T06:29:50.009Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון פרויקט', '2025-12-01T09:00:00Z'::timestamptz, '2025-12-01T09:51:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692d99fee552ae692e73e6ba","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.242Z"}'::jsonb, '2025-12-01T11:37:02.458Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הכנת מייל תכן', '2025-12-01T09:00:00Z'::timestamptz, '2025-12-01T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692d596d6553390757124c73","original_client_name":"פלדמן יוסי","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-12-01T07:01:33.671Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abaf7d037b18f7417201' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון פרויקט - עידכונים בתכניות ביצוע', '2025-12-01T09:00:00Z'::timestamptz, '2025-12-01T10:29:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692d8b7e4c8ff9a8b3e2bea4","original_client_name":"ברוד","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-12-01T10:35:10.279Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון פרויקט', '2025-12-01T09:00:00Z'::timestamptz, '2025-12-01T09:51:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692d99fd266b5a12dd9c6e15","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-12-01T11:37:01.751Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - מענה ללקוח , סקירה על תיק ,מייל הנחיות ', '2025-12-01T09:00:00Z'::timestamptz, '2025-12-01T11:03:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692e12cf88be9d9c23ae94c1","original_client_name":"פלדמן יוסי","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-12-01T20:12:31.120Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb4cfe49fa64732bc0f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרה מרחבית - שיחה עם לקוח בעניין פתרון חניות/פח /פיתוח ', '2025-12-01T09:00:00Z'::timestamptz, '2025-12-01T09:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692e133a30c7af6af25b0178","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-12-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-12-01T20:14:18.312Z');
    END IF;

    -- לוג עבור: גדז' אבי-מיכאל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec6874c194a0c7249128' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פגישת תכנון - מענה לשאלות לקוח+עיבוד סקיצה סופית לאישןר לקוח 


', '2025-11-30T09:00:00Z'::timestamptz, '2025-11-30T10:42:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692cc1b555e1be486e25a646","original_client_name":"גדז'' אבי-מיכאל","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-30T20:14:13.079Z');
    END IF;

    -- לוג עבור: דוברסקין מנדי וחיה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb3b3a51cdaf6045bc2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שינויים -לאחר היתר - המשך עדכון שינויים בגובה מרתף ,מדרגות פנים וכו''', '2025-11-26T09:00:00Z'::timestamptz, '2025-11-26T09:34:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6927745a43b0f860e8b66ed0","original_client_name":"דוברסקין מנדי וחיה","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-26T19:42:50.678Z');
    END IF;

    -- לוג עבור: דוברסקין מנדי וחיה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb3b3a51cdaf6045bc2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שינויים -לאחר היתר - עדכון חתך א ותוכנית מרתף שינוי מדרגות וגובה קומה', '2025-11-26T09:00:00Z'::timestamptz, '2025-11-26T10:17:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692714dc0b4d271634464945","original_client_name":"דוברסקין מנדי וחיה","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-26T12:55:24.090Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים תכן', '2025-11-26T09:00:00Z'::timestamptz, '2025-11-26T13:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6927020eff63057a21b9992c","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-26T11:35:10.167Z');
    END IF;

    -- לוג עבור: דוברסקין מנדי וחיה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb3b3a51cdaf6045bc2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פיקוח-לאחר היתר - שינוי מפלס מרתף,
שינוי מהלכי מדרגות לפי בקשת לקוח 
(צריך צוספת תשלום_)', '2025-11-26T09:00:00Z'::timestamptz, '2025-11-26T10:49:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6926ec545c87b39c7c2facba","original_client_name":"דוברסקין מנדי וחיה","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-26T10:02:28.965Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פיקוח-לאחר היתר - תיאום הערות מפקח מול יועצים . עדכון בתוכניות לביצוע ', '2025-11-26T09:00:00Z'::timestamptz, '2025-11-26T10:22:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6926ce5634e3fcf5ca6ab738","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-26T07:54:30.951Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכון עיצוב פנים', '2025-11-25T09:00:00Z'::timestamptz, '2025-11-25T09:14:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6925f5e866344be3f67a8421","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"6922f139831cc8859b5dcbe4","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-25T16:31:04.633Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פיקוח-לאחר היתר - התייחסות להערות מפקח ', '2025-11-24T09:00:00Z'::timestamptz, '2025-11-24T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6924d841ebc321644b359f9b","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-24T20:12:17.822Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - בדיקת נספח סניטרי. מענה ליועץ .מענה ללקוח על שאלות .', '2025-11-24T09:00:00Z'::timestamptz, '2025-11-24T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6924c9d83b2208d183f31af6","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-24T19:10:48.533Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכניות עבודה - מענה ללקוחה על שאלות ועדכון תוכנית נגרות ח.ארונות הורים ', '2025-11-24T09:00:00Z'::timestamptz, '2025-11-24T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6924c99fd89bafae02f48818","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-24T19:09:51.943Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכניות עבודה - מענה ללקוחה על שאלות ועדכון תוכנית נגרות ח.ארונות הורים ', '2025-11-24T09:00:00Z'::timestamptz, '2025-11-24T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6924c99d4f49e9746c13759c","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-24T19:09:49.145Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פגישת תכנון - שיחה עם מעצבת ', '2025-11-24T09:00:00Z'::timestamptz, '2025-11-24T09:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692453bbad8a0f5b7031bfbe","original_client_name":"כפלין שמואל ויהודית","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-24T10:46:51.287Z');
    END IF;

    -- לוג עבור: דוברסקין מנדי וחיה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb3b3a51cdaf6045bc2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שינויים -לאחר היתר - בדיקת אפשרות בקשת לקוח לשינוי מהלך מדרגות (לחלק פודסטים ל2 )
צריך לגבות תוספת תשלום -מהעמלות ', '2025-11-23T09:00:00Z'::timestamptz, '2025-11-23T09:38:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"692301b60919f03bd9b2f7c4","original_client_name":"דוברסקין מנדי וחיה","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-23T10:44:38.639Z');
    END IF;

    -- לוג עבור: קדוש+ לייכטר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222325' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פגישת תכנון - עזרה ללקוח בעניין נספח העמדה של החניות בתבע -מול צילה ', '2025-11-18T09:00:00Z'::timestamptz, '2025-11-18T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"691c9bf5432ad32beb335bf0","original_client_name":"קדוש+ לייכטר","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-18T14:16:53.381Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abaaab515193420103b9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - שיחה עם לקוח על ה.מחיר', '2025-11-18T09:00:00Z'::timestamptz, '2025-11-18T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"691c3bc428f433e983dab5cb","original_client_name":"בדני רונן","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-18T07:26:28.623Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - תגובה לשאלות לקוח', '2025-11-18T09:00:00Z'::timestamptz, '2025-11-18T09:22:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"691c3b84bb189e9f3fecf86d","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-18T07:25:24.571Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abaaab515193420103b9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - שיחה עם לקוח, הסבר ושליחת קבצים ליועצים ', '2025-11-18T09:00:00Z'::timestamptz, '2025-11-18T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"691c4d8081d9602f2bc4246c","original_client_name":"בדני רונן","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-18T08:42:08.841Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכניות עבודה - שיחה עם גל לגבי נספח סניטרי לביצוע ועדכון לקוח ', '2025-11-16T09:00:00Z'::timestamptz, '2025-11-16T09:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"691a0293e31d5db38690ddd5","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-16T14:57:55.024Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abaaab515193420103b9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - ה.מחיר יועצים', '2025-11-16T09:00:00Z'::timestamptz, '2025-11-16T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6919f84d528091420e11b996","original_client_name":"בדני רונן","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-16T14:14:05.305Z');
    END IF;

    -- לוג עבור: גדז' אבי-מיכאל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6919ec6874c194a0c7249128' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכנון', '2025-11-16T09:00:00Z'::timestamptz, '2025-11-16T11:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6919ed5d36bbaed0b7cc937d","original_client_name":"גדז'' אבי-מיכאל","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-16T13:27:25.613Z');
    END IF;

    -- לוג עבור: דוברסקין מנדי וחיה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb3b3a51cdaf6045bc2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'לאחר היתר - מענה למשמעות השינויים במדרגות +עדכון קבלן+מענה ללקוח ', '2025-11-12T09:00:00Z'::timestamptz, '2025-11-12T09:13:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"691495779ae5daff829a1589","original_client_name":"דוברסקין מנדי וחיה","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-12T12:11:03.769Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb4cfe49fa64732bc0f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרה מרחבית - עזרה ללקוח מול הוועדה ', '2025-11-12T09:00:00Z'::timestamptz, '2025-11-12T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69146d9e3cf928fc6bc5fb08","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-12T09:21:02.184Z');
    END IF;

    -- לוג עבור: וישצקי שמואל ופנחס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68f72bb56f726d892d602fa9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרה מרחבית - הנחיות להחתמה עג גרמושקא (גדרות שכנים וועדים ) ', '2025-11-12T09:00:00Z'::timestamptz, '2025-11-12T09:19:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6914664d394f7475114d123c","original_client_name":"וישצקי שמואל ופנחס","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-12T08:49:49.762Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית 
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכנון - מענה ללקוחות ', '2025-11-12T09:00:00Z'::timestamptz, '2025-11-12T09:24:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69145deb688527d3ac9106a4","original_client_name":"כפלין שמואל ויהודית ","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-12T08:14:03.017Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - בדיקת נספח סניטרי לביצוע', '2025-11-11T09:00:00Z'::timestamptz, '2025-11-11T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69145809ba21c705cf90cba5","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-12T07:48:57.076Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba4f6e8cee603818921' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-11-10T09:00:00Z'::timestamptz, '2025-11-10T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b452da79cb470d2e1bb65","original_client_name":"אהרונסון","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-12-11T20:26:53.677Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba4f6e8cee603818921' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-11-10T09:00:00Z'::timestamptz, '2025-11-10T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713eb15f1242c4bf180bb","original_client_name":"אהרונסון","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-12-20T19:23:55.356Z');
    END IF;

    -- לוג עבור: קדוש+ לייכטר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222325' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'לייכטר -תכנון - פגישה לקביעת פרוגרמה וזכויות בניה 
(העלינו את האופציה לשינוי תבע ולהגדיל מרתף לכל קונטור הקומת קרקע +במקום דירת סמך להגדיר אחרת ) ', '2025-11-09T09:00:00Z'::timestamptz, '2025-11-09T12:36:40.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"691474d5d62f6d2886be4624","original_client_name":"קדוש+ לייכטר","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-12T09:51:49.246Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-11-04T09:00:00Z'::timestamptz, '2025-11-04T12:00:03.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6909ac676b17a221d5bbdb84","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"anonymous","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-04T05:33:59.137Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה', '2025-11-03T09:00:00Z'::timestamptz, '2025-11-03T15:00:25.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69087418f8df838e20382f73","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-03T07:21:28.865Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222312' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בדיקת תכניות מהנס', '2025-11-03T09:00:00Z'::timestamptz, '2025-11-03T09:08:21.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69086ccf44ab9e14dbd6cb53","original_client_name":"סודקביץ מענדי","original_created_by_id":"68ff4ef836b72cce27e9f80e","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-03T06:50:23.064Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222329' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בדיקת תכנית יועץ מיגון', '2025-11-03T09:00:00Z'::timestamptz, '2025-11-03T09:11:37.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69085744a5135e2cf9d27c0d","original_client_name":"קוזלובסקי","original_created_by_id":"68ff4ef836b72cce27e9f80e","original_user_email":null,"original_user_name":null,"original_log_date":"2025-11-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-11-03T05:18:28.225Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'גבעוני - תיקונים והתאמות בגרמושקה', '2025-10-30T09:00:00Z'::timestamptz, '2025-10-30T13:27:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69030f78ac7ce0420f78a33a","original_client_name":"גבעוני","original_created_by_id":"68ff4ef836b72cce27e9f80e","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-30T05:10:48.042Z');
    END IF;

    -- לוג עבור: בלינצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abad175af64002301909' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-10-30T09:00:00Z'::timestamptz, '2025-10-30T09:01:19.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6903ce83d31204077e7638fa","original_client_name":"בלינצקי","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-30T18:45:55.093Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עידכונים עפ"י עועצים ', '2025-10-30T09:00:00Z'::timestamptz, '2025-10-30T09:49:41.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6903350256f30e1b27309182","original_client_name":"גבעוני","original_created_by_id":"68ff4ef836b72cce27e9f80e","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-30T07:50:58.604Z');
    END IF;

    -- לוג עבור: בלינצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abad175af64002301909' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-10-30T09:00:00Z'::timestamptz, '2025-10-30T09:00:11.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6903ce2c0d366c47ef0cf0fc","original_client_name":"בלינצקי","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-30T18:44:28.841Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - עדכון לקוח לגבי אפשרות קידום בקרת תכן', '2025-10-28T09:00:00Z'::timestamptz, '2025-10-28T09:24:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6901215480474afaf9e60ccf","original_client_name":"פלדמן יוסי","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-28T18:02:28.291Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית 
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'סקיצות - מענה ללקוח ', '2025-10-28T09:00:00Z'::timestamptz, '2025-10-28T09:38:21.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6901183d7a416d57e99bf149","original_client_name":"כפלין שמואל ויהודית ","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-28T17:23:41.545Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה לביצוע - תשלום נפרד', '2025-10-28T09:00:00Z'::timestamptz, '2025-10-28T10:19:50.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6900c9389419af9aa665a997","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-28T11:46:32.174Z');
    END IF;

    -- לוג עבור: חיליל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '6900a440685f4037bbd34292' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-10-28T09:00:00Z'::timestamptz, '2025-10-28T09:00:05.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6900a48698f214846fdbc6f3","original_client_name":"חיליל","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-28T09:09:58.712Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עיצוב פנים  - סוויטה', '2025-10-28T09:00:00Z'::timestamptz, '2025-10-28T11:56:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6900a08e5693cedf7fe9116d","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-28T08:53:02.921Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222329' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בקרת תכן', '2025-10-28T09:00:00Z'::timestamptz, '2025-10-28T09:52:06.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69009c1cee1c9096ab682810","original_client_name":"קוזלובסקי","original_created_by_id":"68ff4ef836b72cce27e9f80e","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-28T08:34:04.431Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית 
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'סקיצות - מענה ללקוח ובירור מול יועץ מיגון', '2025-10-28T09:00:00Z'::timestamptz, '2025-10-28T09:26:40.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6900791b33bf66fdb7c5cd14","original_client_name":"כפלין שמואל ויהודית ","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-28T06:04:43.139Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שילוב תכניות מעצבת', '2025-10-28T09:00:00Z'::timestamptz, '2025-10-28T09:27:21.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6900782a91dd0b653486ab45","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68ff4ef836b72cce27e9f80e","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-28T06:00:42.068Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee960bd3c6c25a3ac4b96' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - התייחסות לחישובים סטטיים +עדכונים נוספים למהנדס', '2025-10-27T09:00:00Z'::timestamptz, '2025-10-27T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68ffd023365942625689d5d1","original_client_name":"שטראוס","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-27T18:03:47.869Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון תכניות לביצוע', '2025-10-27T09:00:00Z'::timestamptz, '2025-10-27T11:22:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68ff3ed1a8b8c246704afca2","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-27T07:43:45.043Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שאלת לקוח לגבי ה.מחיר פרץ על שינויים ', '2025-10-26T09:00:00Z'::timestamptz, '2025-10-26T09:31:55.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68fe7bd58350545cc58db04d","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-26T17:51:49.296Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222329' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - עדכונים ומענה ללקוח ', '2025-10-26T09:00:00Z'::timestamptz, '2025-10-26T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68fe73d7aa0792c0381c422b","original_client_name":"קוזלובסקי","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-26T17:17:43.476Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'גבעוני - עדכוניפ', '2025-10-26T09:00:00Z'::timestamptz, '2025-10-26T11:34:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68fe0bdd6e66d65020cc58d6","original_client_name":"גבעוני","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-26T09:54:05.602Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן', '2025-10-23T09:00:00Z'::timestamptz, '2025-10-23T11:07:51.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68fa000ec3a96ac4b6ac154a","original_client_name":"גבעוני","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-23T07:14:38.746Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית 
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'אופציה 2 - עיבוד סקיצה 2 ללקוח ', '2025-10-22T09:00:00Z'::timestamptz, '2025-10-22T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f807cc7bdc3e2f405d3693","original_client_name":"כפלין שמואל ויהודית ","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-21T19:23:08.377Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee960bd3c6c25a3ac4b96' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן-התייחסות להודעת לקוח', '2025-10-22T09:00:00Z'::timestamptz, '2025-10-22T10:16:39.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f893334892d22ddca4f75c","original_client_name":"שטראוס","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-22T05:17:55.245Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית 
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פגישת זום-סקיצה 2', '2025-10-22T09:00:00Z'::timestamptz, '2025-10-22T11:31:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f943fba49ed6c2edf200ca","original_client_name":"כפלין שמואל ויהודית ","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-22T17:52:11.911Z');
    END IF;

    -- לוג עבור: וישצקי שמואל ופנחס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68f72bb56f726d892d602fa9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2025-10-21T09:00:00Z'::timestamptz, '2025-10-21T09:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f7370404ea3012b0b0acb2","original_client_name":"וישצקי שמואל ופנחס","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-21T04:32:20.014Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון תכניות לביצוע', '2025-10-21T09:00:00Z'::timestamptz, '2025-10-21T12:16:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f775ac5a8aa799c8275f80","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-21T08:59:40.354Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2025-10-20T09:00:00Z'::timestamptz, '2025-10-20T09:47:51.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f5c81e7a38c2b765a03b79","original_client_name":"פלדמן יוסי","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-20T02:26:54.716Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2025-10-20T09:00:00Z'::timestamptz, '2025-10-20T13:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f7214a2874e639610521df","original_client_name":"פלדמן יוסי","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-21T02:59:38.407Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'מטבח הרשקוביץ - סיום פריסות+עריכת dwf לפגישה+מס'' תמונות השראה', '2025-10-18T09:00:00Z'::timestamptz, '2025-10-18T10:25:16.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f3f43d0b6c54bf58a33a37","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-18T17:10:37.310Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2025-10-16T09:00:00Z'::timestamptz, '2025-10-16T12:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f0cc4a46b66f07f6b74bd0","original_client_name":"פלדמן יוסי","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-16T07:43:22.102Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שליחת תכניות ליועצים - תשלום נפרד', '2025-10-16T09:00:00Z'::timestamptz, '2025-10-16T10:01:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f0e5034949fe688ad19e51","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-16T09:28:51.139Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'מטבח הרשקוביץ - פריסות מטבח ותכנון חזיתות ', '2025-10-16T09:00:00Z'::timestamptz, '2025-10-16T11:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f3e00d4ebdd54598c6ccf7","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-18T15:44:29.321Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'ביקורת לאחר קבלת היתר - ביקןרת תוכנית מהנדס+ריכוז מייל למהנדס+ריכוז מייל תיקונים באדריכלות', '2025-10-16T09:00:00Z'::timestamptz, '2025-10-16T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f13eeb1bac005cd5d1e4dc","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-16T15:52:27.817Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2025-10-16T09:00:00Z'::timestamptz, '2025-10-16T10:03:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f110829114671077ae20e7","original_client_name":"פלדמן יוסי","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-16T12:34:26.121Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2025-10-16T09:00:00Z'::timestamptz, '2025-10-16T09:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f0e521838ea2118aa8b8e2","original_client_name":"פלדמן יוסי","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-16T09:29:21.621Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכונים נוספים בתכנון - תשלום נפרד', '2025-10-15T09:00:00Z'::timestamptz, '2025-10-15T10:02:19.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68ef73c4c1fc91d811cf678e","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-15T07:13:24.519Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222329' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון תכניות לבקרת תכן', '2025-10-05T09:00:00Z'::timestamptz, '2025-10-05T09:57:24.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68e29afb0c840fdd64cfe8de","original_client_name":"קוזלובסקי","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-05T13:21:15.704Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'מענה לשאלות של הלקוח - תשלום נפרד', '2025-10-05T09:00:00Z'::timestamptz, '2025-10-05T09:18:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68e259052e4e9bb31512a877","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-05T08:39:49.856Z');
    END IF;

    -- לוג עבור: דוברסקין מנדי וחיה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb3b3a51cdaf6045bc2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שינוי גבהים  - שיחה עם לקוח ובדיקת נתונים ', '2025-10-05T09:00:00Z'::timestamptz, '2025-10-05T11:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68e19a95fa186f3aaa577624","original_client_name":"דוברסקין מנדי וחיה","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-10-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-10-04T19:07:17.998Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכונים בתכניות לביצוע לאחר ביקור שטח', '2025-09-30T09:00:00Z'::timestamptz, '2025-09-30T09:59:13.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68dbefb1a6aba17eac87d0e8","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-09-30T11:56:49.482Z');
    END IF;

    -- לוג עבור: בלניצקי רחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68dbdea396fc743b797f63f0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'דרישות תכן', '2025-09-30T09:00:00Z'::timestamptz, '2025-09-30T09:11:53.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68dbe19d279b76fe7d7d4524","original_client_name":"בלניצקי רחל","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.243Z"}'::jsonb, '2025-09-30T10:56:45.645Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון בתכניות - תשלום נפרד', '2025-09-30T09:00:00Z'::timestamptz, '2025-09-30T11:07:31.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68dbde59269953c8a08f1d5f","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-30T10:42:49.015Z');
    END IF;

    -- לוג עבור: חדאד שמוליק ורחל
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb9e0b9180e524ee3e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פיקוח בשטח לאחר היתר  - ביקור באתר ', '2025-09-30T09:00:00Z'::timestamptz, '2025-09-30T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68f13fa9776ba313e00034c5","original_client_name":"חדאד שמוליק ורחל","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-10-16T15:55:37.502Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb08b3023731f2013be' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בהגשה', '2025-09-29T09:00:00Z'::timestamptz, '2025-09-29T11:04:19.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68dacf6f3ef53742bfefc157","original_client_name":"גופין","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-29T15:26:55.626Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb08b3023731f2013be' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בהגשה', '2025-09-29T09:00:00Z'::timestamptz, '2025-09-29T10:58:27.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68da676cebdaa2cec5308817","original_client_name":"גופין","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-29T08:03:08.310Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee960bd3c6c25a3ac4b96' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - מענה ללקוח +בירור מול יועצים (גל)+הטמעת קונסטרוקציה +שלב ב בתוכנית הגשה ', '2025-09-29T09:00:00Z'::timestamptz, '2025-09-29T10:28:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68daee2f6d326cf55b46775d","original_client_name":"שטראוס","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-29T17:38:07.499Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שיחה עם לקוחות לגבי שינויים : הגדלת ממד+קיר לא משותף עם חדאד - יש לגבות תשלום ', '2025-09-21T09:00:00Z'::timestamptz, '2025-09-21T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68d4eae8185f3438085f7880","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-25T04:10:32.308Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכניות עבודה לביצוע  - עריכת גליונות +מייל המרכז נקודות הבהרה +בדיקת דרישת תשלום .', '2025-09-17T09:00:00Z'::timestamptz, '2025-09-17T10:24:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68caf096e50fd9ee457567b1","original_client_name":"ווגנר","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-17T14:32:06.588Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee960bd3c6c25a3ac4b96' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - מענה ללקוח לנספחים ניקוז +קונסטרוקציה', '2025-09-17T09:00:00Z'::timestamptz, '2025-09-17T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68ca849ec028696f1c8b746f","original_client_name":"שטראוס","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-17T06:51:26.856Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee960bd3c6c25a3ac4b96' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - בירור סטטוס מול יועצים 
ועדכון לקוח ', '2025-09-16T09:00:00Z'::timestamptz, '2025-09-16T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c9df0d1cc7bf1dca87dcd8","original_client_name":"שטראוס","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-16T19:05:01.918Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abaaab515193420103b9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תכן - שיחה מסכמת עם טל ורונן וארז גיאת לגבי חוסרים +שליחת מייל לדרך ארץ וגיאת .', '2025-09-16T09:00:00Z'::timestamptz, '2025-09-16T11:34:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c9c3363a215785d51ed105","original_client_name":"בדני רונן","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-16T17:06:14.058Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכניות עבודה וביקורת פנימית  - 2 סיום תוכניות חשמל +3 בדיקת תוכניות עבודה לעיון ', '2025-09-15T09:00:00Z'::timestamptz, '2025-09-15T14:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c92c40d7aa8b3d19ac9413","original_client_name":"ווגנר","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-16T06:22:08.087Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה', '2025-09-15T09:00:00Z'::timestamptz, '2025-09-15T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c8260597c6435baa44e23e","original_client_name":"ווגנר","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-15T11:43:17.683Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכנית עבודה -חשמל ', '2025-09-11T09:00:00Z'::timestamptz, '2025-09-11T10:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c29a447e891eb8ff19af9f","original_client_name":"ווגנר","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-11T06:45:40.226Z');
    END IF;

    -- לוג עבור: פלס מנדי וחינא
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68c1d45dab4bc8026ec99399' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שיחה עם איש מיזוג ', '2025-09-11T09:00:00Z'::timestamptz, '2025-09-11T10:03:47.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c2777dde73f67b4cdb4065","original_client_name":"פלס מנדי וחינא","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-11T04:17:17.975Z');
    END IF;

    -- לוג עבור: פלס מנדי וחינא
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68c1d45dab4bc8026ec99399' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שיחה עם לקוחה-תזכורת לבקרת תכן+תשובות לעיצוב פנים', '2025-09-11T09:00:00Z'::timestamptz, '2025-09-11T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c277dfab4bc8026ecf482c","original_client_name":"פלס מנדי וחינא","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-11T04:18:55.416Z');
    END IF;

    -- לוג עבור: פלס מנדי וחיינא 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d022231d' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שיחה עם יועץ מיזוג ווגובסקי ', '2025-09-11T09:00:00Z'::timestamptz, '2025-09-11T10:06:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c279091248fbc816dcf9e9","original_client_name":"פלס מנדי וחיינא 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-11T04:23:53.732Z');
    END IF;

    -- לוג עבור: חינ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68c1e6c5bac444cd5391b24e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-09-11T09:00:00Z'::timestamptz, '2025-09-11T09:00:11.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c298dfa90a49e6f25fa774","original_client_name":"חינ","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-11T06:39:43.301Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בירור לגבי שינוי במיקום חניה -לא מעל שוחה', '2025-09-11T09:00:00Z'::timestamptz, '2025-09-11T09:41:54.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c2d48bbee7d34710387cf3","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-11T10:54:19.434Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-09-11T09:00:00Z'::timestamptz, '2025-09-11T09:04:22.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c2f3159e811608d5c5a03c","original_client_name":"ווגנר","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-11T13:04:37.707Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה', '2025-09-11T09:00:00Z'::timestamptz, '2025-09-11T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c902b3503f507a28d6226b","original_client_name":"ווגנר","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-16T03:24:51.127Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פגישה בוועדה לצורך קידום התיק+עדכון לקוח ', '2025-09-10T09:00:00Z'::timestamptz, '2025-09-10T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c27964502b1f514c63dbdc","original_client_name":"פלדמן יוסי","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-11T04:25:24.120Z');
    END IF;

    -- לוג עבור: פלס מנדי וחיינא 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d022231d' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שיחה עם לקוחה -תזכורת בקרת תכן ותשובות לעיצוב פנים ', '2025-09-10T09:00:00Z'::timestamptz, '2025-09-10T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c278edffa7c0d2dc436435","original_client_name":"פלס מנדי וחיינא 58","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-11T04:23:25.866Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכנית עבודה-חשמל', '2025-09-10T09:00:00Z'::timestamptz, '2025-09-10T10:11:47.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c1d0bf1afc1600e214c986","original_client_name":"ווגנר","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-10T16:25:51.554Z');
    END IF;

    -- לוג עבור: זייגן+קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb853bc318b4c975003' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'טיפול בהערות פקער', '2025-09-10T09:00:00Z'::timestamptz, '2025-09-10T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c188ec441495fdb4782c50","original_client_name":"זייגן+קטן","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-10T11:19:24.055Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb4cfe49fa64732bc0f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שיחה ', '2025-09-10T09:00:00Z'::timestamptz, '2025-09-10T09:09:33.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c121e8aa385295b633633b","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-10T03:59:52.421Z');
    END IF;

    -- לוג עבור: גבעוני
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb000dc70016677f7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בירור סטטוס בקרת תכן ועידכון לקוח ', '2025-09-10T09:00:00Z'::timestamptz, '2025-09-10T09:22:36.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c11ef3bd4ffac776e88351","original_client_name":"גבעוני","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-10T03:47:15.329Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה', '2025-09-09T09:00:00Z'::timestamptz, '2025-09-09T10:15:22.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68bfe865f334f616c6b2530f","original_client_name":"ווגנר","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-09T05:42:13.652Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שיחה עם לקוח בעניין שוחה/מפקח/קבלן /שאלות ייעוץ - לגבות תשלום נפרד בעקבות שינויים ', '2025-09-09T09:00:00Z'::timestamptz, '2025-09-09T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c04d98f358dfe1f4d6ff57","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3852751ab718bbd0e09f1","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-09T12:54:00.367Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה', '2025-09-09T09:00:00Z'::timestamptz, '2025-09-09T11:58:45.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68c03c59f263e1e1d6eb1df8","original_client_name":"ווגנר","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-09T11:40:25.601Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee95f66229a0168b67de1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תוכניות עבודה לביצוע- חשמל', '2025-09-09T09:00:00Z'::timestamptz, '2025-09-09T09:48:56.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68bff64548346f0a07dc08a0","original_client_name":"ווגנר","original_created_by_id":"68b3852751ab718bbd0e09f1","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-09T06:41:25.694Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee95f66229a0168b67dde' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרה מרחבית-מייל הסבר לבודקת ', '2025-09-08T09:00:00Z'::timestamptz, '2025-09-08T10:12:34.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68bf2cfbcbfa1c3db7c978bc","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"68b3852751ab718bbd0e09f1","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-08T16:22:35.812Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה', '2025-09-08T09:00:00Z'::timestamptz, '2025-09-08T11:23:29.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68be959b3be992a25ba7e87b","original_client_name":"ווגנר","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-08T05:36:43.495Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba4f6e8cee603818921' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-09-06T09:00:00Z'::timestamptz, '2025-09-06T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713eb1f6bf1c02772718f","original_client_name":"אהרונסון","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-20T19:23:55.611Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba4f6e8cee603818921' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-09-06T09:00:00Z'::timestamptz, '2025-09-06T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b2d9baf099c6073c4cb0c","original_client_name":"אהרונסון","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-11T18:46:19.731Z');
    END IF;

    -- לוג עבור: בליניצקי רחלי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abadcfe49fa64732bbce' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'טיפול בקרת תכן', '2025-09-04T09:00:00Z'::timestamptz, '2025-09-04T09:18:01.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b9b8ba9177ce7e6211223b","original_client_name":"בליניצקי רחלי","original_created_by_id":"68b3852751ab718bbd0e09f1","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-04T13:05:14.280Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שיחת ועידהה עם קבלן ועדכון מהנדס +סיכום שיחה בקבוצה - לגבות תשלום נפרד בעקבות שינויים ', '2025-09-04T09:00:00Z'::timestamptz, '2025-09-04T09:34:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b9b461ed5e0f6bc06c0454","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3852751ab718bbd0e09f1","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-04T12:46:41.746Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה', '2025-09-04T09:00:00Z'::timestamptz, '2025-09-04T10:34:08.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b99a06cad724d2ac93a0d9","original_client_name":"ווגנר","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-04T10:54:14.378Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה', '2025-09-04T09:00:00Z'::timestamptz, '2025-09-04T09:49:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b983cb3d5e4a65daecffdf","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-04T09:19:23.163Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'התייחסות להערות -בקרה מרחבית', '2025-09-04T09:00:00Z'::timestamptz, '2025-09-04T10:06:13.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b944b54954e0b955bb0d0e","original_client_name":"פלדמן יוסי","original_created_by_id":"68b3852751ab718bbd0e09f1","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-04T04:50:13.659Z');
    END IF;

    -- לוג עבור: פלדמן יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b6fc61a46c8790cd9a1791' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פריסת גדרות', '2025-09-03T09:00:00Z'::timestamptz, '2025-09-03T11:01:37.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b85a85c81fb41562e571c7","original_client_name":"פלדמן יוסי","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-03T12:11:01.566Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שוחת ביוב  - לגבות תשלום נפרד כחלק מהשינויים שנדרשו בעקבות שוחה', '2025-09-03T09:00:00Z'::timestamptz, '2025-09-03T10:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b80894080f758d2a2a57d0","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3852751ab718bbd0e09f1","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-03T06:21:24.307Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי 58
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba92a977dae06724891' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה', '2025-09-02T09:00:00Z'::timestamptz, '2025-09-02T10:54:34.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b6fa702260a349f68b0c47","original_client_name":"אשכנזי מענדי 58","original_created_by_id":"68b3759b2c871646269adb06","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-02T11:08:48.449Z');
    END IF;

    -- לוג עבור: יוקנט דודי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abbc91fb8074395227d2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-09-02T09:00:00Z'::timestamptz, '2025-09-02T09:05:38.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b69eb4856cac18a89a73c6","original_client_name":"יוקנט דודי","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-02T04:37:24.847Z');
    END IF;

    -- לוג עבור: כפלין שמואל ויהודית 
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b376099b76af5baa4ed139' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-09-01T09:00:00Z'::timestamptz, '2025-09-01T09:56:22.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b61297b94d15b9074c4769","original_client_name":"כפלין שמואל ויהודית ","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-01T18:39:35.465Z');
    END IF;

    -- לוג עבור: לאטר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b425546b71ca02f58b44b9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-09-01T09:00:00Z'::timestamptz, '2025-09-01T09:22:14.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"68b5f3118adf048073252d7f","original_client_name":"לאטר","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2025-09-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-09-01T16:25:05.828Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba4f6e8cee603818921' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-05-04T09:00:00Z'::timestamptz, '2025-05-04T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ed5a97d1fbdf66931a","original_client_name":"אהרונסון","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-05-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-20T19:23:57.714Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba4f6e8cee603818921' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-05-04T09:00:00Z'::timestamptz, '2025-05-04T09:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b06a81f03d834be5eafb2","original_client_name":"אהרונסון","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2025-05-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-11T16:00:08.739Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-01-14T09:00:00Z'::timestamptz, '2025-01-14T11:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951afd8716f1bb5df99669f","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-01-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-28T20:31:52.893Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2025-01-08T09:00:00Z'::timestamptz, '2025-01-08T09:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a7f0fe7d50f004828889","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2025-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-28T19:58:08.860Z');
    END IF;

    -- לוג עבור: שיף  יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9b77b12ed2336d8c8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-12-11T09:00:00Z'::timestamptz, '2024-12-11T09:51:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69544b52d72244e295f12785","original_client_name":"שיף  יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-12-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-30T19:59:46.719Z');
    END IF;

    -- לוג עבור: כהן אברהם
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713df4670a37bd66e7119' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-30T09:00:00Z'::timestamptz, '2024-09-30T12:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a3c474b767490eec21ba","original_client_name":"כהן אברהם","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-28T19:40:20.770Z');
    END IF;

    -- לוג עבור: כהן אברהם
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713df4670a37bd66e7119' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-30T09:00:00Z'::timestamptz, '2024-09-30T12:43:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953ddd72ce0a1cc2b81e581","original_client_name":"כהן אברהם","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-30T12:12:39.130Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-30T09:00:00Z'::timestamptz, '2024-09-30T10:27:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953ddaa2bfe60c540a36b58","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-30T12:11:54.941Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-30T09:00:00Z'::timestamptz, '2024-09-30T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953dcae714426545f37748d","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-30T12:07:42.021Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d022231e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-30T09:00:00Z'::timestamptz, '2024-09-30T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953dbf486d7cc207dfd1dc5","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-30T12:04:36.366Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-30T09:00:00Z'::timestamptz, '2024-09-30T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a359bfd2fade2b9962bd","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-28T19:38:33.126Z');
    END IF;

    -- לוג עבור: רסקין יהושוע
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d8949b1d337b98492e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-30T09:00:00Z'::timestamptz, '2024-09-30T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a37ddfa4e94fe0c0223e","original_client_name":"רסקין יהושוע","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-28T19:39:09.194Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-30T09:00:00Z'::timestamptz, '2024-09-30T10:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a3a4513e4891180abfcf","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-28T19:39:48.602Z');
    END IF;

    -- לוג עבור: כהן אברהם
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713df4670a37bd66e7119' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-29T09:00:00Z'::timestamptz, '2024-09-29T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953dbb7380be88a42ab67e3","original_client_name":"כהן אברהם","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-30T12:03:35.754Z');
    END IF;

    -- לוג עבור: כהן אברהם
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713df4670a37bd66e7119' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-29T09:00:00Z'::timestamptz, '2024-09-29T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a32f45e18e78379a7dd4","original_client_name":"כהן אברהם","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-28T19:37:51.021Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-26T09:00:00Z'::timestamptz, '2024-09-26T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953d99b9a73d034281a9f77","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-30T11:54:35.167Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-26T09:00:00Z'::timestamptz, '2024-09-26T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953d932b7ae46026e5d8904","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-30T11:52:50.636Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-26T09:00:00Z'::timestamptz, '2024-09-26T11:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953db7450bbe69df7347210","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.244Z"}'::jsonb, '2025-12-30T12:02:28.298Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-26T09:00:00Z'::timestamptz, '2024-09-26T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a27c67e2ac4da04f3976","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:34:52.919Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-26T09:00:00Z'::timestamptz, '2024-09-26T11:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a0b344a935c4386e9e39","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:27:15.320Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abaaab515193420103b9' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-26T09:00:00Z'::timestamptz, '2024-09-26T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a254876282d985092ac1","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:34:12.093Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-25T09:00:00Z'::timestamptz, '2024-09-25T12:06:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953d5c5ae9fb9ef57ba4d8a","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T11:38:13.384Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-25T09:00:00Z'::timestamptz, '2024-09-25T12:37:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953d5994f605db801d4c448","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T11:37:29.839Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-25T09:00:00Z'::timestamptz, '2024-09-25T12:37:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519f6583692d63b5e6be44","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:21:41.377Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-25T09:00:00Z'::timestamptz, '2024-09-25T12:06:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519f91bfd2fade2b995b65","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:22:25.520Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-24T09:00:00Z'::timestamptz, '2024-09-24T09:33:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519ea3f601d5e9fac563bd","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:18:27.180Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-24T09:00:00Z'::timestamptz, '2024-09-24T10:44:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953d562f0f52ac18babc78a","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T11:36:34.729Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-24T09:00:00Z'::timestamptz, '2024-09-24T10:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953d2cf0b7b8b191c1a7380","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T11:25:35.648Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-24T09:00:00Z'::timestamptz, '2024-09-24T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953d2336be13408ab571a3c","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T11:22:59.307Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-24T09:00:00Z'::timestamptz, '2024-09-24T09:33:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953d079bc37c44f16f58bc2","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T11:15:37.894Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-24T09:00:00Z'::timestamptz, '2024-09-24T10:17:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953cb8ab5c65d6cbaeabfab","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T10:54:34.695Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-24T09:00:00Z'::timestamptz, '2024-09-24T10:44:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519f441b5766f3cc69cc31","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:21:08.619Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-24T09:00:00Z'::timestamptz, '2024-09-24T10:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519ef39e87c2449995ecb6","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:19:47.216Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-24T09:00:00Z'::timestamptz, '2024-09-24T10:17:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519e7fcdaaccf2a844013e","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:17:51.873Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-24T09:00:00Z'::timestamptz, '2024-09-24T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519ed3c68bf247402d884f","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:19:15.979Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-23T09:00:00Z'::timestamptz, '2024-09-23T13:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953cb301b7a6c41361add04","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T10:53:04.671Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-23T09:00:00Z'::timestamptz, '2024-09-23T11:24:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953cafde59a3db413085314","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T10:52:13.891Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-23T09:00:00Z'::timestamptz, '2024-09-23T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953caccfddd748eb7e376fd","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T10:51:24.425Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-23T09:00:00Z'::timestamptz, '2024-09-23T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519deb65f7cf67c8a41ba1","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:15:23.634Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-23T09:00:00Z'::timestamptz, '2024-09-23T11:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519e0a67e2ac4da04f363d","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:15:54.669Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-23T09:00:00Z'::timestamptz, '2024-09-23T13:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519e370278752f5e8f0314","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:16:39.307Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-23T09:00:00Z'::timestamptz, '2024-09-23T09:38:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519e5f5e7bc92fe05085f9","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:17:19.282Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-22T09:00:00Z'::timestamptz, '2024-09-22T15:39:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953ca882c844cffd94cd34c","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T10:50:16.120Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-22T09:00:00Z'::timestamptz, '2024-09-22T15:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519dbf8cedd324f9566582","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:14:39.419Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-22T09:00:00Z'::timestamptz, '2024-09-22T09:21:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519d8df83dae1848a26e11","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:13:49.086Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-22T09:00:00Z'::timestamptz, '2024-09-22T09:21:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953ca284ea59dd4c20360e6","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T10:48:40.385Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T09:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519d0d83692d63b5e6bcd7","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-28T19:11:41.781Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T09:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c99c2c844cffd94cd161","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T10:46:20.164Z');
    END IF;

    -- לוג עבור: קרישבסקי יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da149c38dda90d3325' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T12:43:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c9d5c3fac99155f7508d","original_client_name":"קרישבסקי יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.245Z"}'::jsonb, '2025-12-30T10:47:17.637Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T09:12:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c93de5e4ef45dda66ba8","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:44:45.886Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T10:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953ca04cab7fe24de69b08f","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:48:04.225Z');
    END IF;

    -- לוג עבור: קרישבסקי יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da149c38dda90d3325' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T10:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c9143cfefbd9edb5fc25","original_client_name":"קרישבסקי יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:44:04.414Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T09:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695146ea195c6a6e09f3b6c9","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T13:04:10.828Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T09:12:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519cc24b6bc93033b3a40c","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T19:10:26.484Z');
    END IF;

    -- לוג עבור: קריצבסקי יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dae57967ae58e8946d' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T12:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519d4917e02aa45630adf2","original_client_name":"קריצבסקי יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T19:12:41.240Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T10:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519d688a67e49f2dc52603","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T19:13:12.870Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T09:12:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695146afd2addcfc06db7f74","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T13:03:11.179Z');
    END IF;

    -- לוג עבור: קרישבסקי יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da149c38dda90d3325' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T10:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951467e760ef7c7872dc1f7","original_client_name":"קרישבסקי יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T13:02:22.981Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T09:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c8e5b70d31f8f62d5e15","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:43:17.701Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-19T09:00:00Z'::timestamptz, '2024-09-19T09:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951460adaf42dad5833e80d","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T13:00:26.133Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-18T09:00:00Z'::timestamptz, '2024-09-18T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519beaf601d5e9fac5620c","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T19:06:50.630Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-18T09:00:00Z'::timestamptz, '2024-09-18T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951435e7a613694113c63b6","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T12:49:02.517Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-18T09:00:00Z'::timestamptz, '2024-09-18T17:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69514578e2e78be205daadaf","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T12:58:00.804Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-18T09:00:00Z'::timestamptz, '2024-09-18T17:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519c21842053a61959b281","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T19:07:45.915Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-18T09:00:00Z'::timestamptz, '2024-09-18T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519c52ed8d31d9a4d1e39f","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T19:08:34.341Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-18T09:00:00Z'::timestamptz, '2024-09-18T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c8b5e47abbcf2bdbbfcd","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:42:29.345Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-18T09:00:00Z'::timestamptz, '2024-09-18T17:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c84a7b9c0ff7d3a20012","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:40:42.664Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-18T09:00:00Z'::timestamptz, '2024-09-18T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c81783bccf86fa8df659","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:39:51.780Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-17T09:00:00Z'::timestamptz, '2024-09-17T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951438d32da83ad80104a54","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T12:49:49.312Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-17T09:00:00Z'::timestamptz, '2024-09-17T10:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c7c9df56207d0e681d32","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:38:33.712Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-17T09:00:00Z'::timestamptz, '2024-09-17T12:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c76a2fbe48eebdcdb9c9","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:36:58.863Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-17T09:00:00Z'::timestamptz, '2024-09-17T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c79557660aa9e96265fb","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:37:41.603Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-17T09:00:00Z'::timestamptz, '2024-09-17T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951452e42694442ab0ac594","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T12:56:46.489Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-17T09:00:00Z'::timestamptz, '2024-09-17T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c7f14f5359d2e4a91663","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:39:13.436Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-17T09:00:00Z'::timestamptz, '2024-09-17T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519bc41c1ab3129a6e0fce","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T19:06:12.026Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-17T09:00:00Z'::timestamptz, '2024-09-17T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519ba0eac24886e1a14e53","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T19:05:36.373Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-17T09:00:00Z'::timestamptz, '2024-09-17T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695195fbfe7d50f004827d4e","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T18:41:31.899Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-16T09:00:00Z'::timestamptz, '2024-09-16T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951432bca3cc56f70061dad","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T12:48:11.287Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-16T09:00:00Z'::timestamptz, '2024-09-16T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c73f4fd38ef822a1e4ab","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:36:15.504Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-16T09:00:00Z'::timestamptz, '2024-09-16T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695195d2b868c76c57332786","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T18:40:50.972Z');
    END IF;

    -- לוג עבור: בליניצקי רחלי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5e57967ae58e89472' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-15T09:00:00Z'::timestamptz, '2024-09-15T12:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695142f4462edf8ef1fb83ca","original_client_name":"בליניצקי רחלי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T12:47:16.828Z');
    END IF;

    -- לוג עבור: תבע בלניצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d81f6631bbef5bb2df' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-15T09:00:00Z'::timestamptz, '2024-09-15T12:13:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c7135f51bfb1569a0634","original_client_name":"תבע בלניצקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:35:31.962Z');
    END IF;

    -- לוג עבור: בליניצקי רחלי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5e57967ae58e89472' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-15T09:00:00Z'::timestamptz, '2024-09-15T12:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695195af76be1ed8cabaf8aa","original_client_name":"בליניצקי רחלי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T18:40:15.505Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-12T09:00:00Z'::timestamptz, '2024-09-12T10:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951915728a7714c78e3a7e0","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T18:21:43.321Z');
    END IF;

    -- לוג עבור: ברכהן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4cd803cc80e322509' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-12T09:00:00Z'::timestamptz, '2024-09-12T11:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953c6dab82a7f6a5fc4f157","original_client_name":"ברכהן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-30T10:34:34.818Z');
    END IF;

    -- לוג עבור: ברכהן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4cd803cc80e322509' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-12T09:00:00Z'::timestamptz, '2024-09-12T11:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519586ad5879a451e84fea","original_client_name":"ברכהן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T18:39:34.359Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-12T09:00:00Z'::timestamptz, '2024-09-12T11:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519560a6884a4a4c7c26ca","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.246Z"}'::jsonb, '2025-12-28T18:38:56.817Z');
    END IF;

    -- לוג עבור: ברכהן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e4cd803cc80e322509' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-12T09:00:00Z'::timestamptz, '2024-09-12T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951409672577b2077294a30","original_client_name":"ברכהן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-28T12:37:10.894Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-11T09:00:00Z'::timestamptz, '2024-09-11T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69513fc1680416103bf3ae1c","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-28T12:33:37.075Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd4352a8d538799988' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-11T09:00:00Z'::timestamptz, '2024-09-11T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69513ff7f9546d8d161efcfe","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-28T12:34:31.985Z');
    END IF;

    -- לוג עבור: זנד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e14a6146ca7c374455' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-11T09:00:00Z'::timestamptz, '2024-09-11T09:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69514042748e8af6dd7713c8","original_client_name":"זנד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-28T12:35:46.717Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-10T09:00:00Z'::timestamptz, '2024-09-10T15:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69513f00226be0d105c1111f","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-28T12:30:24.535Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-09T09:00:00Z'::timestamptz, '2024-09-09T16:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695132b6f27cf07e93a44459","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-28T11:37:58.098Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222329' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-08T09:00:00Z'::timestamptz, '2024-09-08T14:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6947f45464aa035fa1575795","original_client_name":"קוזלובסקי","original_created_by_id":"68a6f600fc1ba67c0b6a6b01","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-21T11:21:24.237Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222329' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-08T09:00:00Z'::timestamptz, '2024-09-08T19:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ecf9ccc37762cdd59a","original_client_name":"קוזלובסקי","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:56.081Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-08T09:00:00Z'::timestamptz, '2024-09-08T14:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6947f3e033ce9c9b20e25b78","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-21T11:19:28.654Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d02222fa' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-05T09:00:00Z'::timestamptz, '2024-09-05T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ec94681d669d47d82d","original_client_name":"ליכטינשטיין","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:56.236Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d02222fa' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-05T09:00:00Z'::timestamptz, '2024-09-05T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b165fcf8e55a3adb54255","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-11T17:07:11.394Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb491fb807439522792' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-04T09:00:00Z'::timestamptz, '2024-09-04T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ec94681d669d47d82e","original_client_name":"הולצמן","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:56.436Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb491fb807439522792' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-04T09:00:00Z'::timestamptz, '2024-09-04T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b117cf904129de8c2427d","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-11T16:46:20.911Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-03T09:00:00Z'::timestamptz, '2024-09-03T15:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ed1f6bf1c027727191","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:57.004Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-03T09:00:00Z'::timestamptz, '2024-09-03T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b08f9fae66a76d7705300","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-11T16:10:01.713Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-03T09:00:00Z'::timestamptz, '2024-09-03T15:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b0a9229120346326650ce","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-11T16:16:50.710Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d02222fa' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-03T09:00:00Z'::timestamptz, '2024-09-03T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b0e3f6490f42a73492fc0","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-11T16:32:31.291Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb491fb807439522792' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-03T09:00:00Z'::timestamptz, '2024-09-03T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b1126f6b9bc0d91d32a51","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-11T16:44:54.076Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb491fb807439522792' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-03T09:00:00Z'::timestamptz, '2024-09-03T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ecfcd9c70f9e8460f3","original_client_name":"הולצמן","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:56.635Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-03T09:00:00Z'::timestamptz, '2024-09-03T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ed6b42f16dc3687a7c","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:57.234Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d02222fa' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-03T09:00:00Z'::timestamptz, '2024-09-03T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ecdca78d1a9bea40da","original_client_name":"ליכטינשטיין","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:56.788Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-02T09:00:00Z'::timestamptz, '2024-09-02T12:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ed41dbf02e234dd9a2","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:57.865Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-02T09:00:00Z'::timestamptz, '2024-09-02T12:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693acbe1ae0192f5726b8285","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-11T11:49:21.036Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-02T09:00:00Z'::timestamptz, '2024-09-02T13:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b08a0cfcb0b2f5c4bf36b","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-11T16:08:32.356Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-09-02T09:00:00Z'::timestamptz, '2024-09-02T13:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713ed5b6b4192153d4020","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:57.456Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'זום', '2024-09-01T09:00:00Z'::timestamptz, '2024-09-01T14:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693ac5570f6d52febda72a79","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-11T11:21:27.325Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d022231b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עדכון סטטוס', '2024-09-01T09:00:00Z'::timestamptz, '2024-09-01T11:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713eeaa087004b147006b","original_client_name":"פורוש","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:58.176Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1ababe0b9180e524ee35c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'זום', '2024-09-01T09:00:00Z'::timestamptz, '2024-09-01T14:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713eefdefb3c10193df63","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2024-09-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-20T19:23:58.021Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e79f34b26e38077500' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-08-02T09:00:00Z'::timestamptz, '2024-08-02T16:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557b52c61d5f097cc9ae59","original_client_name":"אחיאלי עופר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-08-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-31T17:36:50.065Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-11T09:00:00Z'::timestamptz, '2024-07-11T16:48:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695426260a6cda71ddf9d9ee","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T17:21:10.957Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-10T09:00:00Z'::timestamptz, '2024-07-10T10:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954126f20a31ea9103d190a","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:57:03.177Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-10T09:00:00Z'::timestamptz, '2024-07-10T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954253fd16fca11b9bf480c","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T17:17:19.675Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-10T09:00:00Z'::timestamptz, '2024-07-10T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954258d0fc01d5dd513f8e0","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T17:18:37.182Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-10T09:00:00Z'::timestamptz, '2024-07-10T11:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695425ee2e387866d3c843af","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T17:20:14.362Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-09T09:00:00Z'::timestamptz, '2024-07-09T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954123a5459fe703a75924b","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:56:10.031Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-08T09:00:00Z'::timestamptz, '2024-07-08T14:28:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695412156b4259451e0a450b","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:55:33.480Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-04T09:00:00Z'::timestamptz, '2024-07-04T11:46:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695411d718eabb53ca42e987","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:54:31.154Z');
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-04T09:00:00Z'::timestamptz, '2024-07-04T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954116aa4b6d343c09c80b6","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:52:42.722Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-04T09:00:00Z'::timestamptz, '2024-07-04T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954113bce0e1b544a0e9c34","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:51:55.489Z');
    END IF;

    -- לוג עבור: פויזנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbba7f08f150831fb6' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-03T09:00:00Z'::timestamptz, '2024-07-03T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540f78e96456fba4e24329","original_client_name":"פויזנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:44:24.768Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-03T09:00:00Z'::timestamptz, '2024-07-03T10:13:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540f2184f3765bedf80f1f","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:42:57.968Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-03T09:00:00Z'::timestamptz, '2024-07-03T13:46:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540eac4acc311c67af4d5b","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:41:00.898Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-01T09:00:00Z'::timestamptz, '2024-07-01T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540d7d65fd9da26f9f8bd5","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:35:57.967Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-07-01T09:00:00Z'::timestamptz, '2024-07-01T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540dc7b618c9b62c136172","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-07-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:37:11.827Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-30T09:00:00Z'::timestamptz, '2024-06-30T09:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540c69af2e6781f593ebf1","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:31:21.279Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-30T09:00:00Z'::timestamptz, '2024-06-30T13:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540c9843ed8d3861d7663c","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:32:08.461Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-30T09:00:00Z'::timestamptz, '2024-06-30T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540cc4ed74bfeb60d71223","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:32:52.273Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3cc44ee4854feadad' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-27T09:00:00Z'::timestamptz, '2024-06-27T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540c046049442ca69ee33f","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:29:40.805Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-27T09:00:00Z'::timestamptz, '2024-06-27T10:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540c3ce96456fba4e23104","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:30:36.291Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-26T09:00:00Z'::timestamptz, '2024-06-26T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540b6471aac4acc711487d","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:27:00.964Z');
    END IF;

    -- לוג עבור: קרישבסקי יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da149c38dda90d3325' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-25T09:00:00Z'::timestamptz, '2024-06-25T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695408984dd0753797533fba","original_client_name":"קרישבסקי יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:15:04.071Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-25T09:00:00Z'::timestamptz, '2024-06-25T09:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695408c0191da3da4a729262","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:15:44.782Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abaf7d037b18f7417201' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-25T09:00:00Z'::timestamptz, '2024-06-25T16:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695408ff3871fd57cd6f8432","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:16:47.971Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-25T09:00:00Z'::timestamptz, '2024-06-25T13:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954092d84f3765bedf80937","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:17:33.235Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-24T09:00:00Z'::timestamptz, '2024-06-24T09:39:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695407e8a3bfaeb5f5b6f507","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:12:08.164Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-24T09:00:00Z'::timestamptz, '2024-06-24T15:42:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954086ccc7d08610ae0cb4f","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:14:20.823Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-24T09:00:00Z'::timestamptz, '2024-06-24T09:16:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540822ae708933129785ea","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:13:06.112Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee9604b7ecc28d0222329' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-23T09:00:00Z'::timestamptz, '2024-06-23T11:26:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695404ccfe5e5a59c7aa85f5","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T14:58:52.033Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'סוף', '2024-06-23T09:00:00Z'::timestamptz, '2024-06-23T09:13:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695407746f6be9bc4d6e28c4","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:10:12.391Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-23T09:00:00Z'::timestamptz, '2024-06-23T13:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695407aba51d794ed11e2131","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T15:11:07.936Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-20T09:00:00Z'::timestamptz, '2024-06-20T14:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954045f7b5c28d65457368e","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T14:57:03.800Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-20T09:00:00Z'::timestamptz, '2024-06-20T11:23:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954049028ece619c0b7c3af","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T14:57:52.190Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-20T09:00:00Z'::timestamptz, '2024-06-20T10:12:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954042c72cc7a63d21998e2","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.247Z"}'::jsonb, '2025-12-30T14:56:12.714Z');
    END IF;

    -- לוג עבור: מינסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd2484a6a0851155e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-19T09:00:00Z'::timestamptz, '2024-06-19T15:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695402b8fe5e5a59c7aa84cf","original_client_name":"מינסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T14:50:00.106Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פקער', '2024-06-19T09:00:00Z'::timestamptz, '2024-06-19T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e24230934daca17b34ef","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:31:30.656Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-19T09:00:00Z'::timestamptz, '2024-06-19T09:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e2956d78a0a51e914801","original_client_name":"שטראוס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:32:53.402Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-19T09:00:00Z'::timestamptz, '2024-06-19T11:44:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e2bd9f076a013873c870","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:33:33.500Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-19T09:00:00Z'::timestamptz, '2024-06-19T09:36:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e2e38bcc2d2471d3a7f3","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:34:11.223Z');
    END IF;

    -- לוג עבור: זנד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e14a6146ca7c374455' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-19T09:00:00Z'::timestamptz, '2024-06-19T09:16:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e31a74f26c10117874ff","original_client_name":"זנד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:35:06.903Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-19T09:00:00Z'::timestamptz, '2024-06-19T11:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540318d43e0bdb3c9fd39c","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T14:51:36.062Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-18T09:00:00Z'::timestamptz, '2024-06-18T09:44:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e16be841e1aaece8d4fd","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:27:55.175Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-18T09:00:00Z'::timestamptz, '2024-06-18T10:16:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e0f930934daca17b31bf","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:26:01.324Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-18T09:00:00Z'::timestamptz, '2024-06-18T10:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e1bd6b7e5e85d9db0fed","original_client_name":"שטראוס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:29:17.318Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-18T09:00:00Z'::timestamptz, '2024-06-18T11:23:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e19cfae2dbc5d6d79e34","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:28:44.696Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-18T09:00:00Z'::timestamptz, '2024-06-18T13:39:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e1467a45d62f3a6be01a","original_client_name":"שטראוס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:27:18.514Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-17T09:00:00Z'::timestamptz, '2024-06-17T10:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e0cb506784d98fca7641","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:25:15.726Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-17T09:00:00Z'::timestamptz, '2024-06-17T11:07:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e080e4982b5f23a71817","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:24:00.621Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-17T09:00:00Z'::timestamptz, '2024-06-17T12:38:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e056dab0ecc7e6763b39","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:23:18.192Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-16T09:00:00Z'::timestamptz, '2024-06-16T10:44:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e002714426545f3779c5","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:21:54.387Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-16T09:00:00Z'::timestamptz, '2024-06-16T10:18:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6953e0289ef7d1b5efaf0bab","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T12:22:32.028Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-16T09:00:00Z'::timestamptz, '2024-06-16T10:28:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b982d5a1d73e7b6d2e69","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:13:06.802Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-16T09:00:00Z'::timestamptz, '2024-06-16T09:42:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b962d5e55fa6c75f9630","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:12:34.904Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-16T09:00:00Z'::timestamptz, '2024-06-16T11:38:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b931b7fbc06ea3c22324","original_client_name":"שטראוס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:11:45.154Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-13T09:00:00Z'::timestamptz, '2024-06-13T14:19:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b908513e4891180adf9f","original_client_name":"שטראוס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-13","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:11:04.174Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-10T09:00:00Z'::timestamptz, '2024-06-10T11:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b821588ac2bd90cf041b","original_client_name":"שטראוס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:07:13.675Z');
    END IF;

    -- לוג עבור: קרישבסקי יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da149c38dda90d3325' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-10T09:00:00Z'::timestamptz, '2024-06-10T09:28:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b84e5c8a18c7a0bd8dae","original_client_name":"קרישבסקי יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:07:58.537Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-10T09:00:00Z'::timestamptz, '2024-06-10T10:56:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b8736ae84061a71fc8c4","original_client_name":"שטראוס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:08:35.839Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-10T09:00:00Z'::timestamptz, '2024-06-10T09:11:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b89ea76e44e484d61abc","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:09:18.032Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-10T09:00:00Z'::timestamptz, '2024-06-10T11:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b8d072728ac62c73475d","original_client_name":"שטראוס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:10:08.654Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-09T09:00:00Z'::timestamptz, '2024-06-09T09:38:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b7654992b5a6aa03ebdd","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:04:05.979Z');
    END IF;

    -- לוג עבור: קרישבסקי יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da149c38dda90d3325' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-09T09:00:00Z'::timestamptz, '2024-06-09T11:28:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b7c4f83dae1848a2901a","original_client_name":"קרישבסקי יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:05:40.192Z');
    END IF;

    -- לוג עבור: שטראוס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9ac36678431706b17' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-09T09:00:00Z'::timestamptz, '2024-06-09T11:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b7ec0e3f4125df20eb59","original_client_name":"שטראוס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:06:20.008Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-06T09:00:00Z'::timestamptz, '2024-06-06T10:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b745d35c40ff57fe3a70","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:03:33.325Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-06T09:00:00Z'::timestamptz, '2024-06-06T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b722df6758d6f87dad93","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:02:58.616Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-06T09:00:00Z'::timestamptz, '2024-06-06T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b6d94537ab3f237e5fe9","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:01:45.681Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-04T09:00:00Z'::timestamptz, '2024-06-04T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b6bc7ddfed277c69337c","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:01:16.811Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-04T09:00:00Z'::timestamptz, '2024-06-04T12:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b6982bf135109de02917","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T21:00:40.073Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-03T09:00:00Z'::timestamptz, '2024-06-03T10:57:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b66a04aa99db005dba67","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T20:59:54.978Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-02T09:00:00Z'::timestamptz, '2024-06-02T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b5e42b3209d1ca040e32","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T20:57:40.695Z');
    END IF;

    -- לוג עבור: בורגן-גרודקא-הרשקוביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e65a97d1fbdf669315' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-02T09:00:00Z'::timestamptz, '2024-06-02T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b61a9174e8b769371281","original_client_name":"בורגן-גרודקא-הרשקוביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T20:58:34.397Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd4352a8d538799988' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-01T09:00:00Z'::timestamptz, '2024-06-01T09:26:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b4f5716f1bb5df997124","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T20:53:41.405Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd4352a8d538799988' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-01T09:00:00Z'::timestamptz, '2024-06-01T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b550e4af06735a040655","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T20:55:12.553Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-01T09:00:00Z'::timestamptz, '2024-06-01T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b58427b62eb64ed6a00e","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-28T20:56:04.929Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd4352a8d538799988' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-01T09:00:00Z'::timestamptz, '2024-06-01T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695505b343d31817fb00b924","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-31T09:14:59.983Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd4352a8d538799988' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-06-01T09:00:00Z'::timestamptz, '2024-06-01T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69540d1a595b935b69883f0f","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-06-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T15:34:18.789Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-03-31T09:00:00Z'::timestamptz, '2024-03-31T14:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69545686532b45f3f446e637","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-03-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:47:34.151Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-03-28T09:00:00Z'::timestamptz, '2024-03-28T15:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695456523c267953b311c50f","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-03-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:46:42.520Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-27T09:00:00Z'::timestamptz, '2024-01-27T16:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954561fd57c31f6df40ee8f","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:45:51.905Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-26T09:00:00Z'::timestamptz, '2024-01-26T09:58:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695455f1a00c2047a3f26730","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:45:05.105Z');
    END IF;

    -- לוג עבור: שיף  יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9b77b12ed2336d8c8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-26T09:00:00Z'::timestamptz, '2024-01-26T09:57:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695455a8bf677ca47c06aa53","original_client_name":"שיף  יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:43:52.546Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-21T09:00:00Z'::timestamptz, '2024-01-21T13:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954557fc5d10076fc6803eb","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:43:11.454Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-20T09:00:00Z'::timestamptz, '2024-01-20T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69545548da1cdf4f5529ce12","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:42:16.332Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-19T09:00:00Z'::timestamptz, '2024-01-19T14:57:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954551eda1cdf4f5529cdfc","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:41:34.785Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-19T09:00:00Z'::timestamptz, '2024-01-19T09:47:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695454c502da3b342382b76a","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:40:05.988Z');
    END IF;

    -- לוג עבור: זנד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e14a6146ca7c374455' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-18T09:00:00Z'::timestamptz, '2024-01-18T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695453eb4023bba3a4976ae6","original_client_name":"זנד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:36:27.713Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-18T09:00:00Z'::timestamptz, '2024-01-18T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695453ba5e97631829db70e2","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:35:38.631Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-18T09:00:00Z'::timestamptz, '2024-01-18T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695454951c7d921cea4f8640","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:39:17.049Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-18T09:00:00Z'::timestamptz, '2024-01-18T09:07:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69545472428c5b574208c174","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:38:42.204Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-18T09:00:00Z'::timestamptz, '2024-01-18T10:39:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69545452391f1376ca485afa","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:38:10.550Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-18T09:00:00Z'::timestamptz, '2024-01-18T10:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954542e6f83ca6f5b07d6eb","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:37:34.548Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-18T09:00:00Z'::timestamptz, '2024-01-18T09:39:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954540e76bcc3495592fe57","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:37:02.136Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-17T09:00:00Z'::timestamptz, '2024-01-17T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69544b7d416875e9f2b10010","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.248Z"}'::jsonb, '2025-12-30T20:00:29.731Z');
    END IF;

    -- לוג עבור: פויזנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbba7f08f150831fb6' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-17T09:00:00Z'::timestamptz, '2024-01-17T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69544bad919fff28ce256bcf","original_client_name":"פויזנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-30T20:01:17.794Z');
    END IF;

    -- לוג עבור: זנד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e14a6146ca7c374455' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2024-01-17T09:00:00Z'::timestamptz, '2024-01-17T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6954538fac4b9f85b3d12f3f","original_client_name":"זנד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2024-01-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-30T20:34:55.518Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba5ee656722098553ef' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-11-09T09:00:00Z'::timestamptz, '2023-11-09T09:01:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"693b2c6bdd273bf64994528e","original_client_name":"אחיאלי עופר","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2023-11-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-11T18:41:15.210Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba5ee656722098553ef' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-11-09T09:00:00Z'::timestamptz, '2023-11-09T09:01:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"694713eb4192ce58d7121aac","original_client_name":"אחיאלי עופר","original_created_by_id":"68bed660afc2486dabb8491a","original_user_email":null,"original_user_name":null,"original_log_date":"2023-11-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-20T19:23:55.865Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-30T09:00:00Z'::timestamptz, '2023-08-30T09:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a4ae09de70f68c8cf5d0","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:33:18.547Z');
    END IF;

    -- לוג עבור: טיירי אשר- מגורים
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e119145780f8a9ca2e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-30T09:00:00Z'::timestamptz, '2023-08-30T12:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a510d62a56e0a2870fdc","original_client_name":"טיירי אשר- מגורים","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:34:56.874Z');
    END IF;

    -- לוג עבור: שקד גלית וחזי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9c0807425253a35c7' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-29T09:00:00Z'::timestamptz, '2023-08-29T11:16:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a3f2ef965c64aa2d5307","original_client_name":"שקד גלית וחזי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:30:10.060Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-29T09:00:00Z'::timestamptz, '2023-08-29T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a2fad71fc64046f33f25","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:26:02.222Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-28T09:00:00Z'::timestamptz, '2023-08-28T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a2b84f9d32265b8099a7","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:24:56.986Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-28T09:00:00Z'::timestamptz, '2023-08-28T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a178bd01fa049eacb68e","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:19:36.396Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-28T09:00:00Z'::timestamptz, '2023-08-28T12:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a1c762534b8d0222307e","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:20:55.305Z');
    END IF;

    -- לוג עבור: טיירי אשר- מגורים
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e119145780f8a9ca2e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-28T09:00:00Z'::timestamptz, '2023-08-28T10:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a22f39c028797afe9bdb","original_client_name":"טיירי אשר- מגורים","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:22:39.224Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-28T09:00:00Z'::timestamptz, '2023-08-28T11:06:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a287fe58da7bdde4589e","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:24:07.949Z');
    END IF;

    -- לוג עבור: טיירי אשר- מגורים
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e119145780f8a9ca2e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-27T09:00:00Z'::timestamptz, '2023-08-27T12:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a0b6d56a37c806936207","original_client_name":"טיירי אשר- מגורים","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:16:22.220Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e79f34b26e38077500' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-27T09:00:00Z'::timestamptz, '2023-08-27T10:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a0e1beee751399fd9dc6","original_client_name":"אחיאלי עופר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:17:05.616Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-27T09:00:00Z'::timestamptz, '2023-08-27T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955a1309300746e4bf2b113","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:18:24.481Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-24T09:00:00Z'::timestamptz, '2023-08-24T14:47:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558e49e64ce13e998cf233","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:57:45.529Z');
    END IF;

    -- לוג עבור: שקד גלית וחזי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9c0807425253a35c7' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-24T09:00:00Z'::timestamptz, '2023-08-24T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69559e73b34a07450311265b","original_client_name":"שקד גלית וחזי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:06:43.008Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-24T09:00:00Z'::timestamptz, '2023-08-24T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69559f646c80860d6bd9b111","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T20:10:44.498Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e79f34b26e38077500' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2023-08-23T09:00:00Z'::timestamptz, '2023-08-23T09:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558d83b47e9dd93aad803c","original_client_name":"אחיאלי עופר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:54:27.062Z');
    END IF;

    -- לוג עבור: גורביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e46cc0d01cb54488e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-23T09:00:00Z'::timestamptz, '2023-08-23T11:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558d0c1d45e41bcebb0ac0","original_client_name":"גורביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:52:28.069Z');
    END IF;

    -- לוג עבור: טיירי אשר- מגורים
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e119145780f8a9ca2e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-23T09:00:00Z'::timestamptz, '2023-08-23T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558dbdcf01bb0c066bc37d","original_client_name":"טיירי אשר- מגורים","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:55:25.054Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-23T09:00:00Z'::timestamptz, '2023-08-23T13:26:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558d4f58d2268c90bc47da","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:53:35.416Z');
    END IF;

    -- לוג עבור: גורביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e46cc0d01cb54488e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-22T09:00:00Z'::timestamptz, '2023-08-22T15:39:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558cd9f1fdc4386b20e29c","original_client_name":"גורביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:51:37.069Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-22T09:00:00Z'::timestamptz, '2023-08-22T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558ca6dd82f91e7c527d01","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:50:46.313Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-21T09:00:00Z'::timestamptz, '2023-08-21T10:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558bd22f2b0b8cb9d6c7d3","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:47:14.106Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-21T09:00:00Z'::timestamptz, '2023-08-21T15:48:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558c5ddc8623047abafb38","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:49:33.330Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd4352a8d538799988' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-20T09:00:00Z'::timestamptz, '2023-08-20T15:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695586ae243730741e22c520","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:25:18.561Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-17T09:00:00Z'::timestamptz, '2023-08-17T14:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955862d3be24ce919440ba1","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:23:09.850Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd4352a8d538799988' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-17T09:00:00Z'::timestamptz, '2023-08-17T10:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955864e8ebd1c4633eeee8f","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:23:42.209Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-17T09:00:00Z'::timestamptz, '2023-08-17T10:32:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558682a4f962191559f4dc","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:24:34.007Z');
    END IF;

    -- לוג עבור: שיף  יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9b77b12ed2336d8c8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-16T09:00:00Z'::timestamptz, '2023-08-16T09:42:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695582ffd4c795c0c1c682ae","original_client_name":"שיף  יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:09:35.332Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-16T09:00:00Z'::timestamptz, '2023-08-16T10:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557f74356c1aacdf145d44","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:54:28.591Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-16T09:00:00Z'::timestamptz, '2023-08-16T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69558608b55352b77a1bbab4","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T18:22:32.352Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-14T09:00:00Z'::timestamptz, '2023-08-14T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557ec10ceb5acbbf002980","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:51:29.375Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-14T09:00:00Z'::timestamptz, '2023-08-14T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557eee18a13787cc32353d","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:52:14.646Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה', '2023-08-14T09:00:00Z'::timestamptz, '2023-08-14T13:18:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557f4320087386a50643cf","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:53:39.653Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e79f34b26e38077500' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-08T09:00:00Z'::timestamptz, '2023-08-08T09:38:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557e0ddc20c0213c8d2e26","original_client_name":"אחיאלי עופר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:48:29.263Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-08T09:00:00Z'::timestamptz, '2023-08-08T13:26:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557e37c6c6d502c7ca2a7a","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:49:11.217Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-08T09:00:00Z'::timestamptz, '2023-08-08T11:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557e6dbe1576c56543ec53","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:50:05.549Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-08T09:00:00Z'::timestamptz, '2023-08-08T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557e923c3b0c23c02421d4","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:50:42.634Z');
    END IF;

    -- לוג עבור: ויינפלד שלמה -תבע
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e2bd68f75fee00b7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים לתיק מידע', '2023-08-08T09:00:00Z'::timestamptz, '2023-08-08T09:22:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557debfdf2c17cbd429c65","original_client_name":"ויינפלד שלמה -תבע","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:47:55.516Z');
    END IF;

    -- לוג עבור: קדוש+ לייכטר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc01c90eff4ae2d02c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיק מידע', '2023-08-07T09:00:00Z'::timestamptz, '2023-08-07T09:34:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557d8cd10df3f935f729b9","original_client_name":"קדוש+ לייכטר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:46:20.983Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-07T09:00:00Z'::timestamptz, '2023-08-07T12:43:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557db5beee751399fd43dc","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:47:01.941Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-07T09:00:00Z'::timestamptz, '2023-08-07T12:03:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557d370b1b1f397fe3e410","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.249Z"}'::jsonb, '2025-12-31T17:44:55.778Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-06T09:00:00Z'::timestamptz, '2023-08-06T13:53:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557d1259d323221f5addba","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:44:18.179Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-06T09:00:00Z'::timestamptz, '2023-08-06T11:29:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557cd80ceb5acbbf002424","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:43:20.721Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים אחרונים לפני ועדה', '2023-08-06T09:00:00Z'::timestamptz, '2023-08-06T09:43:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557ca118fa7f7364dc282f","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:42:25.367Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-03T09:00:00Z'::timestamptz, '2023-08-03T11:44:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557c5da990014e07bea34f","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:41:17.381Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-03T09:00:00Z'::timestamptz, '2023-08-03T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557c36f03172c4fdd3a31c","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:40:38.844Z');
    END IF;

    -- לוג עבור: ויינפלד שלמה -תבע
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e2bd68f75fee00b7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגשת תיק מידע', '2023-08-03T09:00:00Z'::timestamptz, '2023-08-03T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557c111f51059dc5479a5c","original_client_name":"ויינפלד שלמה -תבע","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:40:01.493Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-03T09:00:00Z'::timestamptz, '2023-08-03T11:38:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557bdc3be24ce91943f3e2","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:39:08.764Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e79f34b26e38077500' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-03T09:00:00Z'::timestamptz, '2023-08-03T09:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557b9865aebec19f34b477","original_client_name":"אחיאלי עופר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:38:00.452Z');
    END IF;

    -- לוג עבור: גורביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e46cc0d01cb54488e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-02T09:00:00Z'::timestamptz, '2023-08-02T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557b6def965c64aa2d1103","original_client_name":"גורביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:37:17.105Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'בקרת תוכן', '2023-08-01T09:00:00Z'::timestamptz, '2023-08-01T09:47:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557b28c38b6326284a83a7","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:36:08.289Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-01T09:00:00Z'::timestamptz, '2023-08-01T09:18:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557ae31d45e41bcebaf60a","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:34:59.879Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e79f34b26e38077500' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-08-01T09:00:00Z'::timestamptz, '2023-08-01T14:14:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557abe2f78d4f9c078521c","original_client_name":"אחיאלי עופר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:34:22.401Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פקער', '2023-08-01T09:00:00Z'::timestamptz, '2023-08-01T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695579447d3f9dcfae5738a1","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-08-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:28:04.493Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה ', '2023-07-31T09:00:00Z'::timestamptz, '2023-07-31T09:17:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695578c3a487ef2f5d186426","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:25:55.252Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-31T09:00:00Z'::timestamptz, '2023-07-31T12:46:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695578e37d3f9dcfae57387b","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:26:27.554Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-30T09:00:00Z'::timestamptz, '2023-07-30T09:42:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955787ed4c795c0c1c6713b","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:24:46.530Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-26T09:00:00Z'::timestamptz, '2023-07-26T09:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557795fe58da7bdde40c47","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:20:53.262Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e79f34b26e38077500' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-26T09:00:00Z'::timestamptz, '2023-07-26T09:13:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955785551125c184f9db3a1","original_client_name":"אחיאלי עופר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:24:05.760Z');
    END IF;

    -- לוג עבור: ויינפלד שלמה -תבע
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e2bd68f75fee00b7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-26T09:00:00Z'::timestamptz, '2023-07-26T11:32:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557826600e24446d55de4b","original_client_name":"ויינפלד שלמה -תבע","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:23:18.318Z');
    END IF;

    -- לוג עבור: סלפושניק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbcd803cc80e322502' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-25T09:00:00Z'::timestamptz, '2023-07-25T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557750f0d0f2c96efc897c","original_client_name":"סלפושניק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:19:44.058Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-25T09:00:00Z'::timestamptz, '2023-07-25T09:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695577339397ae651a1d42aa","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:19:15.024Z');
    END IF;

    -- לוג עבור: ויינפלד שלמה -תבע
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e2bd68f75fee00b7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-25T09:00:00Z'::timestamptz, '2023-07-25T10:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695576ac4f9fa5821ea39a08","original_client_name":"ויינפלד שלמה -תבע","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:17:00.196Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-25T09:00:00Z'::timestamptz, '2023-07-25T09:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695576ebfe58c1900853c1dd","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:18:03.574Z');
    END IF;

    -- לוג עבור: טיירי אשר- מגורים
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e119145780f8a9ca2e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-25T09:00:00Z'::timestamptz, '2023-07-25T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955770fc5383f1a964fcda0","original_client_name":"טיירי אשר- מגורים","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-25","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:18:39.413Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-24T09:00:00Z'::timestamptz, '2023-07-24T09:23:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955755aeaccd06a81293e5b","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:11:22.444Z');
    END IF;

    -- לוג עבור: ויינפלד שלמה -תבע
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e2bd68f75fee00b7e0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-24T09:00:00Z'::timestamptz, '2023-07-24T12:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695576811b0bac7ce26480e5","original_client_name":"ויינפלד שלמה -תבע","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:16:17.556Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-23T09:00:00Z'::timestamptz, '2023-07-23T10:27:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695574feb55352b77a1b92ea","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:09:50.714Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-23T09:00:00Z'::timestamptz, '2023-07-23T11:19:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557528d4c795c0c1c6616b","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:10:32.890Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-20T09:00:00Z'::timestamptz, '2023-07-20T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955744ebd01fa049eac6eff","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:06:54.504Z');
    END IF;

    -- לוג עבור: זוהר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26f66ed855b4d3a28' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגדלת מרפסת', '2023-07-20T09:00:00Z'::timestamptz, '2023-07-20T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955747cf684575e2c964c21","original_client_name":"זוהר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:07:40.373Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-19T09:00:00Z'::timestamptz, '2023-07-19T12:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69555300c5383f1a964f88dd","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:44:48.275Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-19T09:00:00Z'::timestamptz, '2023-07-19T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695573341c90cfd5b48a3061","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:02:12.421Z');
    END IF;

    -- לוג עבור: סלפושניק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbcd803cc80e322502' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-19T09:00:00Z'::timestamptz, '2023-07-19T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557357eaccd06a8129397c","original_client_name":"סלפושניק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:02:47.895Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'שליחת  מסמכים לד''''א', '2023-07-19T09:00:00Z'::timestamptz, '2023-07-19T09:32:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69557409cc5e22187120f891","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:05:45.753Z');
    END IF;

    -- לוג עבור: בדני רונן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e6c35b1bd7689bb160' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-19T09:00:00Z'::timestamptz, '2023-07-19T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695573a97f0d19bbe83a7bd6","original_client_name":"בדני רונן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:04:09.338Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-19T09:00:00Z'::timestamptz, '2023-07-19T10:39:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955738b13825c35cd98544a","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T17:03:39.701Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-18T09:00:00Z'::timestamptz, '2023-07-18T09:49:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695552ca20087386a505d1ba","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:43:54.540Z');
    END IF;

    -- לוג עבור: טיירי אשר- מגורים
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e119145780f8a9ca2e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-18T09:00:00Z'::timestamptz, '2023-07-18T11:07:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955527ed9ec82da251db10f","original_client_name":"טיירי אשר- מגורים","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:42:38.544Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-17T09:00:00Z'::timestamptz, '2023-07-17T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695551262d33aa9613243228","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:36:54.116Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הכנת מסמכים ,בקרת תוכן', '2023-07-17T09:00:00Z'::timestamptz, '2023-07-17T09:18:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695551013814da655d85213c","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:36:17.122Z');
    END IF;

    -- לוג עבור: תבע בלניצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d81f6631bbef5bb2df' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-17T09:00:00Z'::timestamptz, '2023-07-17T09:41:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695550ce80641406fd66949e","original_client_name":"תבע בלניצקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:35:26.309Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'פקער', '2023-07-17T09:00:00Z'::timestamptz, '2023-07-17T09:12:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695550a3c5383f1a964f8552","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:34:43.873Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-11T09:00:00Z'::timestamptz, '2023-07-11T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554f8bf939da661512386e","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:30:03.306Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-11T09:00:00Z'::timestamptz, '2023-07-11T09:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554fae92cd5a6103cd4d29","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:30:38.040Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגשת תיקונים', '2023-07-11T09:00:00Z'::timestamptz, '2023-07-11T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955500066f41f97d2d81ce4","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:32:00.960Z');
    END IF;

    -- לוג עבור: רבינוביץ  מאיר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d84027d994c14ff5ab' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-11T09:00:00Z'::timestamptz, '2023-07-11T11:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695550725a065c14a02e0f4b","original_client_name":"רבינוביץ  מאיר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:33:54.654Z');
    END IF;

    -- לוג עבור: אחיאלי עופר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e79f34b26e38077500' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-10T09:00:00Z'::timestamptz, '2023-07-10T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554edde0dec662afc6839c","original_client_name":"אחיאלי עופר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:27:09.194Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגשה', '2023-07-10T09:00:00Z'::timestamptz, '2023-07-10T10:54:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554ebeb47e9dd93aad0af3","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:26:38.200Z');
    END IF;

    -- לוג עבור: זוהר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26f66ed855b4d3a28' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-10T09:00:00Z'::timestamptz, '2023-07-10T11:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554e8d600e24446d55801d","original_client_name":"זוהר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:25:49.162Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-10T09:00:00Z'::timestamptz, '2023-07-10T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554f04657e2999bff44e21","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:27:48.528Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-10T09:00:00Z'::timestamptz, '2023-07-10T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554f2797889d2c8f7c1840","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:28:23.168Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2023-07-10T09:00:00Z'::timestamptz, '2023-07-10T11:36:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554f57cea72107df9708c9","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:29:11.192Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-09T09:00:00Z'::timestamptz, '2023-07-09T10:53:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554e3b18fa7f7364dbff04","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.250Z"}'::jsonb, '2025-12-31T14:24:27.288Z');
    END IF;

    -- לוג עבור: זוהר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26f66ed855b4d3a28' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-07-09T09:00:00Z'::timestamptz, '2023-07-09T13:19:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554e65bbb265e2fabdc05b","original_client_name":"זוהר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T14:25:09.803Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'המשך תיק מידע', '2023-07-06T09:00:00Z'::timestamptz, '2023-07-06T09:57:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554d9b04b60db5665adc2d","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T14:21:47.183Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישוי זמין', '2023-07-06T09:00:00Z'::timestamptz, '2023-07-06T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554dced4c795c0c1c622da","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T14:22:38.594Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים', '2023-07-06T09:00:00Z'::timestamptz, '2023-07-06T09:33:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554e01900f098a27a9a982","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-07-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T14:23:29.769Z');
    END IF;

    -- לוג עבור: תבע בלניצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d81f6631bbef5bb2df' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-31T09:00:00Z'::timestamptz, '2023-05-31T09:17:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553b936642b48888d9abbc","original_client_name":"תבע בלניצקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T13:04:51.235Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-31T09:00:00Z'::timestamptz, '2023-05-31T11:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553bf0378e28bba4804428","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-31","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T13:06:24.447Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-30T09:00:00Z'::timestamptz, '2023-05-30T12:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553b27cf8c84b2dba1a261","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T13:03:03.847Z');
    END IF;

    -- לוג עבור: פויזנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbba7f08f150831fb6' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-30T09:00:00Z'::timestamptz, '2023-05-30T09:49:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553b453f05e05be80712b9","original_client_name":"פויזנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T13:03:33.645Z');
    END IF;

    -- לוג עבור: קדוש+ לייכטר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc01c90eff4ae2d02c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-30T09:00:00Z'::timestamptz, '2023-05-30T09:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553b6017a7c26b3cd64fc0","original_client_name":"קדוש+ לייכטר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-30","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T13:04:00.958Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-29T09:00:00Z'::timestamptz, '2023-05-29T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553ab696731003ea75243c","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T13:01:10.960Z');
    END IF;

    -- לוג עבור: פויזנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbba7f08f150831fb6' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-29T09:00:00Z'::timestamptz, '2023-05-29T11:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553addf6fd55f3d066b8c6","original_client_name":"פויזנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T13:01:49.079Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-29T09:00:00Z'::timestamptz, '2023-05-29T10:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553afbbaf4e0b8a77ec152","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-29","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T13:02:19.314Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-28T09:00:00Z'::timestamptz, '2023-05-28T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695539adc0915653f841b8e9","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:56:45.025Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-28T09:00:00Z'::timestamptz, '2023-05-28T10:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553917c2cccb2b90aa2d10","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:54:15.664Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd4352a8d538799988' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-28T09:00:00Z'::timestamptz, '2023-05-28T11:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553a9b78e75e7335e00901","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T13:00:43.439Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-28T09:00:00Z'::timestamptz, '2023-05-28T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553a1fb0dcdbe58012cdb9","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:58:39.333Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עיצוב פנים', '2023-05-24T09:00:00Z'::timestamptz, '2023-05-24T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695538e14e36792a56f8eca5","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-24","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:53:21.759Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עיצוב מטבח', '2023-05-23T09:00:00Z'::timestamptz, '2023-05-23T11:42:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955389788f2af175a9d1e5f","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:52:07.604Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות ביצוע', '2023-05-23T09:00:00Z'::timestamptz, '2023-05-23T12:29:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553867e86789eb6b42fba2","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:51:19.758Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-22T09:00:00Z'::timestamptz, '2023-05-22T12:28:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695537e9f77e84b4f8ea529b","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:49:13.728Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-22T09:00:00Z'::timestamptz, '2023-05-22T10:04:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955380700a7025646aca9d9","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:49:43.111Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-22T09:00:00Z'::timestamptz, '2023-05-22T10:38:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955382f70ad32bd49809b59","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:50:23.982Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'התאמה לקונטור', '2023-05-18T09:00:00Z'::timestamptz, '2023-05-18T13:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553718f6db042b5dc8ef57","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:45:44.052Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-18T09:00:00Z'::timestamptz, '2023-05-18T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695537b3847918a9a4106c1d","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:48:19.641Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-17T09:00:00Z'::timestamptz, '2023-05-17T10:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695536b8236a260cadb9a312","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:44:08.692Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-16T09:00:00Z'::timestamptz, '2023-05-16T10:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695536382daebb4352038d75","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:42:00.070Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-15T09:00:00Z'::timestamptz, '2023-05-15T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695535a7b1c7fdc7bbb7ebc3","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:39:35.588Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-15T09:00:00Z'::timestamptz, '2023-05-15T09:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695535d6d9907fb90540ad22","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:40:22.076Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-11T09:00:00Z'::timestamptz, '2023-05-11T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553548efb6d19c2b8d0c13","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:38:00.332Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-10T09:00:00Z'::timestamptz, '2023-05-10T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695535208e464937a3f258df","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:37:20.949Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-10T09:00:00Z'::timestamptz, '2023-05-10T13:47:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695533fcb3e05075a84e4a26","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:32:28.775Z');
    END IF;

    -- לוג עבור: זוהר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26f66ed855b4d3a28' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-10T09:00:00Z'::timestamptz, '2023-05-10T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955358588e16eace4f95ce6","original_client_name":"זוהר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:39:01.307Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-08T09:00:00Z'::timestamptz, '2023-05-08T17:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695533cd6fb47faf9ff00ea7","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:31:41.876Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-04T09:00:00Z'::timestamptz, '2023-05-04T10:34:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552fd97c308853620de390","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-31T12:14:49.348Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-04T09:00:00Z'::timestamptz, '2023-05-04T12:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a5eebbe5138e624ad5a1","original_client_name":"ווגנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-28T19:49:34.332Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-04T09:00:00Z'::timestamptz, '2023-05-04T12:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a5bf5b3be49fdb484c04","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.251Z"}'::jsonb, '2025-12-28T19:48:47.016Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-04T09:00:00Z'::timestamptz, '2023-05-04T09:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695530d4dcdc62f045eb1232","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:19:00.048Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-04T09:00:00Z'::timestamptz, '2023-05-04T09:36:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695530b2b69bfbdd372f4720","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:18:26.568Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-04T09:00:00Z'::timestamptz, '2023-05-04T12:34:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955304c36a6935afc354e83","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:16:44.831Z');
    END IF;

    -- לוג עבור: גורביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e46cc0d01cb54488e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-04T09:00:00Z'::timestamptz, '2023-05-04T09:36:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695530270d41a47384a8a3c9","original_client_name":"גורביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:16:07.774Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552f3176c7e20e231ade48","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:12:01.593Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a544ef0bd7447bc79dd3","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-28T19:46:44.882Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a56dfbf5d7d62a3d7baa","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-28T19:47:25.554Z');
    END IF;

    -- לוג עבור: פויזנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbba7f08f150831fb6' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552fa3b52f80cb9bc0c66d","original_client_name":"פויזנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:13:55.705Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552f8074e0fe28309cc88b","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:13:20.681Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T10:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552f5a2f91fe9801eb403e","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:12:42.317Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3970ee9e62bb09fcf' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T14:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a59d1bd40278feb50968","original_client_name":"ווגנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-28T19:48:13.558Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552eff081562fe00f05fac","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:11:11.908Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T09:07:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552e1922d7fe73b8dbea00","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:07:21.828Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T09:43:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552e81a915c9be3fd85d2e","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:09:05.886Z');
    END IF;

    -- לוג עבור: סודקביץ מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3fb352b72a2fdc34' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-03T09:00:00Z'::timestamptz, '2023-05-03T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552ecb50f239b3c99dc0fd","original_client_name":"סודקביץ מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:10:19.323Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-02T09:00:00Z'::timestamptz, '2023-05-02T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a422cfc82f37f898c7cc","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-28T19:41:54.862Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-02T09:00:00Z'::timestamptz, '2023-05-02T16:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552d8714732742c6cda23c","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:04:55.882Z');
    END IF;

    -- לוג עבור: חנונו
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1bd8c1200cfd49fd1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-02T09:00:00Z'::timestamptz, '2023-05-02T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552bafb5695f6fb729bd1c","original_client_name":"חנונו","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T11:57:03.356Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-02T09:00:00Z'::timestamptz, '2023-05-02T09:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552df79c75185f400670f1","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:06:47.412Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-01T09:00:00Z'::timestamptz, '2023-05-01T09:19:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552dd57ea8786912d5c64f","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T12:06:13.322Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-01T09:00:00Z'::timestamptz, '2023-05-01T10:44:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69552a67721e60df143e6103","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T11:51:35.128Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-01T09:00:00Z'::timestamptz, '2023-05-01T12:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69550820c14ebdbfab890e7b","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T09:25:20.300Z');
    END IF;

    -- לוג עבור: חנונו
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1bd8c1200cfd49fd1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-01T09:00:00Z'::timestamptz, '2023-05-01T09:23:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695529ff5405a02efe6a05d1","original_client_name":"חנונו","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T11:49:51.143Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-05-01T09:00:00Z'::timestamptz, '2023-05-01T10:32:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955095f27046baf6fe4c979","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-05-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2025-12-31T09:30:39.368Z');
    END IF;

    -- לוג עבור: כהן אברהם
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713df4670a37bd66e7119' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיק פרסום', '2023-02-05T09:00:00Z'::timestamptz, '2023-02-05T09:46:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956898bfc6cc581dc474439","original_client_name":"כהן אברהם","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2026-01-01T12:49:47.016Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'התאמה לקונטור מודד', '2023-02-05T09:00:00Z'::timestamptz, '2023-02-05T10:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956895eaf977447cf542e93","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2026-01-01T12:49:02.890Z');
    END IF;

    -- לוג עבור: מינסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd2484a6a0851155e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'חישוב כמויות ', '2023-02-05T09:00:00Z'::timestamptz, '2023-02-05T10:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69568926595329fe806612e4","original_client_name":"מינסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.252Z"}'::jsonb, '2026-01-01T12:48:06.098Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקון בטופס רשות העתיקות ', '2023-02-05T09:00:00Z'::timestamptz, '2023-02-05T09:18:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695688e9ac1b3258727b6002","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-05","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T12:47:05.470Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עריכת גרמושקא', '2023-02-02T09:00:00Z'::timestamptz, '2023-02-02T13:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695674e89baeb09a5f4e00d9","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T11:21:44.236Z');
    END IF;

    -- לוג עבור: סטמבלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db69bffd197efb66d3' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיק פרסום', '2023-02-02T09:00:00Z'::timestamptz, '2023-02-02T09:09:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695675ce9557619354b9c07c","original_client_name":"סטמבלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T11:25:34.803Z');
    END IF;

    -- לוג עבור: שיף  יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9b77b12ed2336d8c8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הנפקת מסמכים', '2023-02-02T09:00:00Z'::timestamptz, '2023-02-02T09:11:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956754579d0db0a30ba5983","original_client_name":"שיף  יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T11:23:17.879Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הדפסת גרמושקא', '2023-02-02T09:00:00Z'::timestamptz, '2023-02-02T10:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956751d3250d64a2805a310","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-02","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T11:22:37.638Z');
    END IF;

    -- לוג עבור: סטמבלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db69bffd197efb66d3' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיק פרסום', '2023-02-01T09:00:00Z'::timestamptz, '2023-02-01T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69566fd8134b77be00427e5c","original_client_name":"סטמבלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T11:00:08.034Z');
    END IF;

    -- לוג עבור: סטמבלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db69bffd197efb66d3' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-02-01T09:00:00Z'::timestamptz, '2023-02-03T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69567091623f06794a9e8c2b","original_client_name":"סטמבלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T11:03:13.396Z');
    END IF;

    -- לוג עבור: כהן אברהם
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713df4670a37bd66e7119' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיק פרסום', '2023-02-01T09:00:00Z'::timestamptz, '2023-02-01T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69567014ef74bb6fc55c1229","original_client_name":"כהן אברהם","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-02-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T11:01:08.852Z');
    END IF;

    -- לוג עבור: סלפושניק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbcd803cc80e322502' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-28T09:00:00Z'::timestamptz, '2023-01-28T16:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695702e7476ef7fe8092e632","original_client_name":"סלפושניק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T21:27:35.276Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-28T09:00:00Z'::timestamptz, '2023-01-28T09:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6957027e4dc952b9dba57e1d","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T21:25:50.140Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-28T09:00:00Z'::timestamptz, '2023-01-28T09:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6957029b7d8e94482fd14386","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T21:26:19.316Z');
    END IF;

    -- לוג עבור: סלפושניק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbcd803cc80e322502' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-27T09:00:00Z'::timestamptz, '2023-01-27T14:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69570258e439cdbfa112d1f2","original_client_name":"סלפושניק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T21:25:12.369Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-27T09:00:00Z'::timestamptz, '2023-01-27T09:56:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6957023c770523a5e9b30bbb","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T21:24:44.081Z');
    END IF;

    -- לוג עבור: בורובסקי לאה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e54d8e4af0a935093d' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-27T09:00:00Z'::timestamptz, '2023-01-27T10:06:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6957020bd867d21c6e3db943","original_client_name":"בורובסקי לאה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T21:23:55.873Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-27T09:00:00Z'::timestamptz, '2023-01-27T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695701eef553aa2fb95151f9","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-27","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T21:23:26.363Z');
    END IF;

    -- לוג עבור: בורובסקי לאה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e54d8e4af0a935093d' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-26T09:00:00Z'::timestamptz, '2023-01-26T10:33:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695701d214c0474187057f86","original_client_name":"בורובסקי לאה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T21:22:58.736Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-26T09:00:00Z'::timestamptz, '2023-01-26T09:38:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695701acad445b16c779cd93","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T21:22:20.537Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-26T09:00:00Z'::timestamptz, '2023-01-26T10:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69570190db8324d7cdb58247","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.254Z"}'::jsonb, '2026-01-01T21:21:52.499Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-26T09:00:00Z'::timestamptz, '2023-01-26T09:53:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6957016d7f53cda00c0c59c9","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:21:17.954Z');
    END IF;

    -- לוג עבור: בורובסקי לאה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abac78bf660223e301b0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-26T09:00:00Z'::timestamptz, '2023-01-26T13:43:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69570141e96e9f1e7b8e0e17","original_client_name":"בורובסקי לאה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:20:33.287Z');
    END IF;

    -- לוג עבור: בורובסקי לאה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e54d8e4af0a935093d' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-23T09:00:00Z'::timestamptz, '2023-01-23T10:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695700deeb9b71080d2de455","original_client_name":"בורובסקי לאה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:18:54.345Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-23T09:00:00Z'::timestamptz, '2023-01-23T09:07:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6957009949e2754b620d2514","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:17:45.586Z');
    END IF;

    -- לוג עבור: גורביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e46cc0d01cb54488e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-23T09:00:00Z'::timestamptz, '2023-01-23T09:48:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6957007ae6f889d66b42cf96","original_client_name":"גורביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-23","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:17:14.268Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-22T09:00:00Z'::timestamptz, '2023-01-22T13:33:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956ffe6a1f12585b1d21801","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:14:46.042Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-22T09:00:00Z'::timestamptz, '2023-01-22T11:34:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69570031a8a6f48163ce99be","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:16:01.126Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-22T09:00:00Z'::timestamptz, '2023-01-22T09:26:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695700101e0e63fe203b69a9","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-22","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:15:28.389Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee960bd3c6c25a3ac4b92' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה לביצוע', '2023-01-21T09:00:00Z'::timestamptz, '2023-01-21T17:03:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956ffb6db8324d7cdb580c9","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-21","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:13:58.068Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-20T09:00:00Z'::timestamptz, '2023-01-20T09:33:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fe6908585e279787879b","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:08:25.125Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1aba991fb80743952274a' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-20T09:00:00Z'::timestamptz, '2023-01-20T09:37:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fe854f9ab6e333a21d07","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:08:53.686Z');
    END IF;

    -- לוג עבור: סלפושניק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbcd803cc80e322502' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-20T09:00:00Z'::timestamptz, '2023-01-20T09:31:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956feae10e50530dc18f5ed","original_client_name":"סלפושניק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:09:34.089Z');
    END IF;

    -- לוג עבור: רסקין דובה ואיציק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d88fcb8bffb5c929bd' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות עבודה לפיתוח', '2023-01-20T09:00:00Z'::timestamptz, '2023-01-20T14:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fef2ddc052cbb4b3f54a","original_client_name":"רסקין דובה ואיציק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-20","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:10:42.501Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-19T09:00:00Z'::timestamptz, '2023-01-19T10:47:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fe3d36dd10bf5d1cdc5f","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:07:41.607Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-19T09:00:00Z'::timestamptz, '2023-01-19T12:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fe0d78cf3b29de858895","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-19","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:06:53.619Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-17T09:00:00Z'::timestamptz, '2023-01-17T09:52:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695536e58cdc86eeff5e9c66","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T12:44:53.153Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-16T09:00:00Z'::timestamptz, '2023-01-16T11:13:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fdcd5173b113d8a1da21","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:05:49.094Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-16T09:00:00Z'::timestamptz, '2023-01-16T12:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553605b3adf9d4c97f779a","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T12:41:09.811Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-16T09:00:00Z'::timestamptz, '2023-01-16T11:08:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fda8181f2c03dc92648f","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:05:12.223Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-16T09:00:00Z'::timestamptz, '2023-01-16T09:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fd736d97cee248a857c7","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:04:19.691Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-16T09:00:00Z'::timestamptz, '2023-01-16T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fd5014c047418705770a","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:03:44.470Z');
    END IF;

    -- לוג עבור: פויזנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbba7f08f150831fb6' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רשות עתיקות', '2023-01-15T09:00:00Z'::timestamptz, '2023-01-15T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fcee5b0a7cdc87afe409","original_client_name":"פויזנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:02:06.889Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רשות עתיקות', '2023-01-15T09:00:00Z'::timestamptz, '2023-01-15T09:52:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fd16669dbb6f2e386636","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:02:46.174Z');
    END IF;

    -- לוג עבור: גופין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e441dbf02e234dd99f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'מילוי מסמכים', '2023-01-14T09:00:00Z'::timestamptz, '2023-01-14T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fc95fa27dfdd52a4eb97","original_client_name":"גופין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T21:00:37.792Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-14T09:00:00Z'::timestamptz, '2023-01-14T14:41:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956facb0dda36773b6e3517","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T20:52:59.690Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-13T09:00:00Z'::timestamptz, '2023-01-13T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fa289ae3bb0e3fdbc105","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-13","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T20:50:16.902Z');
    END IF;

    -- לוג עבור: זילברשטרום
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e1fb0bda21381cf0c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תכניות ביצוע', '2023-01-13T09:00:00Z'::timestamptz, '2023-01-13T13:21:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956fa6ed8044f52ea8b1107","original_client_name":"זילברשטרום","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-13","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T20:51:26.860Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-12T09:00:00Z'::timestamptz, '2023-01-12T12:43:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956f9fb322eb451f416481c","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T20:49:31.543Z');
    END IF;

    -- לוג עבור: ועקנין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e2614d16a485ad249d' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-12T09:00:00Z'::timestamptz, '2023-01-12T12:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956f970bacc88bc75974491","original_client_name":"ועקנין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T20:47:12.617Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'עיבוד תכניות ושרטוט חזיתות', '2023-01-12T09:00:00Z'::timestamptz, '2023-01-12T14:03:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956f924c0063023d396b9f2","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-12","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T20:45:56.827Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-11T09:00:00Z'::timestamptz, '2023-01-11T14:53:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69555031f96f8aece137e3ae","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T14:32:49.379Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-11T09:00:00Z'::timestamptz, '2023-01-11T09:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956f89e08585e2797877f49","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T20:43:42.404Z');
    END IF;

    -- לוג עבור: שיף  יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9b77b12ed2336d8c8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-10T09:00:00Z'::timestamptz, '2023-01-10T09:33:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695534c98af1fcfe11431094","original_client_name":"שיף  יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T12:35:53.012Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-10T09:00:00Z'::timestamptz, '2023-01-10T09:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695534f8e7390b0b7e52c292","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T12:36:40.264Z');
    END IF;

    -- לוג עבור: פויזנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbba7f08f150831fb6' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-09T09:00:00Z'::timestamptz, '2023-01-09T10:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956e7ed59074d6904bc34e7","original_client_name":"פויזנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T19:32:29.464Z');
    END IF;

    -- לוג עבור: פורוש
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db2c388c900459bfb4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'מחסן', '2023-01-09T09:00:00Z'::timestamptz, '2023-01-09T14:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956e7ca64f53e8b908ed5e4","original_client_name":"פורוש","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T19:31:54.046Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-09T09:00:00Z'::timestamptz, '2023-01-09T09:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956dfd496e63745a3cc21f9","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:57:56.872Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-08T09:00:00Z'::timestamptz, '2023-01-08T12:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956da4a03844b62780a37d7","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:34:18.834Z');
    END IF;

    -- לוג עבור: מינסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd2484a6a0851155e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-08T09:00:00Z'::timestamptz, '2023-01-08T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956d98def0761ccef128489","original_client_name":"מינסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:31:09.865Z');
    END IF;

    -- לוג עבור: סלפושניק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbcd803cc80e322502' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'סקיצות', '2023-01-08T09:00:00Z'::timestamptz, '2023-01-08T10:07:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956d9be63c78b7f02d16dd0","original_client_name":"סלפושניק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:31:58.030Z');
    END IF;

    -- לוג עבור: שקד גלית וחזי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9c0807425253a35c7' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-08T09:00:00Z'::timestamptz, '2023-01-08T09:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956d9fb8c0926b74c223c4a","original_client_name":"שקד גלית וחזי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:32:59.146Z');
    END IF;

    -- לוג עבור: גורביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e46cc0d01cb54488e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-08T09:00:00Z'::timestamptz, '2023-01-08T09:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956df331479fc3459313058","original_client_name":"גורביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:55:15.995Z');
    END IF;

    -- לוג עבור: פלס
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc38fb07ad33772b0e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-07T09:00:00Z'::timestamptz, '2023-01-07T13:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695533085de39ed66c01d835","original_client_name":"פלס","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T12:28:24.555Z');
    END IF;

    -- לוג עבור: שיף  יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9b77b12ed2336d8c8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-07T09:00:00Z'::timestamptz, '2023-01-07T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6955332ff099eba010321b69","original_client_name":"שיף  יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T12:29:03.968Z');
    END IF;

    -- לוג עבור: צייזלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dc6129d679a64b82d1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בגרמושקא', '2023-01-07T09:00:00Z'::timestamptz, '2023-01-07T10:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956d95c50a21fd9084549ba","original_client_name":"צייזלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:30:20.237Z');
    END IF;

    -- לוג עבור: שקד גלית וחזי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9c0807425253a35c7' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-07T09:00:00Z'::timestamptz, '2023-01-07T11:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956d92559074d6904bc1b83","original_client_name":"שקד גלית וחזי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:29:25.638Z');
    END IF;

    -- לוג עבור: גורביץ
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e46cc0d01cb54488e4' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-07T09:00:00Z'::timestamptz, '2023-01-07T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956d8f99c645a94aa262703","original_client_name":"גורביץ","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:28:41.825Z');
    END IF;

    -- לוג עבור: סלפושניק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbcd803cc80e322502' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'סקיצה', '2023-01-07T09:00:00Z'::timestamptz, '2023-01-07T10:23:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956d8bdb5c08485e79a4ed7","original_client_name":"סלפושניק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:27:41.094Z');
    END IF;

    -- לוג עבור: סטמבלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db69bffd197efb66d3' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגשת תיק פרסום', '2023-01-07T09:00:00Z'::timestamptz, '2023-01-07T09:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956d88df15dc6894ab4b650","original_client_name":"סטמבלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T18:26:53.201Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-06T09:00:00Z'::timestamptz, '2023-01-06T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554afea058de61e23134fd","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T14:10:38.414Z');
    END IF;

    -- לוג עבור: סטמבלר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713db69bffd197efb66d3' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגשת תיק פרסום ', '2023-01-06T09:00:00Z'::timestamptz, '2023-01-06T13:04:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695689e7cb07d266f66d0cbd","original_client_name":"סטמבלר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T12:51:19.490Z');
    END IF;

    -- לוג עבור: תבע בלניצקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d81f6631bbef5bb2df' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-06T09:00:00Z'::timestamptz, '2023-01-06T10:28:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554ad3076cfc4c2910ebc0","original_client_name":"תבע בלניצקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T14:09:55.293Z');
    END IF;

    -- לוג עבור: סוויסה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713de3d29f2677fa53e6b' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-06T09:00:00Z'::timestamptz, '2023-01-06T09:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554aa6f00eff7b73cbde7c","original_client_name":"סוויסה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T14:09:10.110Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-06T09:00:00Z'::timestamptz, '2023-01-06T10:29:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6956cb91808fd57b0d81aeef","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2026-01-01T17:31:29.486Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-06T09:00:00Z'::timestamptz, '2023-01-06T11:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554a73a79057d987542113","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-06","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T14:08:19.848Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-04T09:00:00Z'::timestamptz, '2023-01-04T13:12:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554a14715705514aee7fe9","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T14:06:44.905Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-04T09:00:00Z'::timestamptz, '2023-01-04T09:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695548ca6320b7babc86f9b2","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T14:01:14.140Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-04T09:00:00Z'::timestamptz, '2023-01-04T09:37:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695549d0f939da6615122ed3","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T14:05:36.012Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-04T09:00:00Z'::timestamptz, '2023-01-04T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"695549a9f5f9cf6dbf321d53","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-04","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T14:04:57.478Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-03T09:00:00Z'::timestamptz, '2023-01-03T09:32:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553fe087e38d6dcd8db593","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T13:23:12.742Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-03T09:00:00Z'::timestamptz, '2023-01-03T11:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69554012cfb856f19353c9c4","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-03","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T13:24:02.751Z');
    END IF;

    -- לוג עבור: אשכנזי מענדי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e687b7166cf54edd26' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'תיקונים בתכניות ביצוע', '2023-01-01T09:00:00Z'::timestamptz, '2023-01-01T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553f3096731003ea753158","original_client_name":"אשכנזי מענדי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T13:20:16.730Z');
    END IF;

    -- לוג עבור: זנד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e14a6146ca7c374455' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-01T09:00:00Z'::timestamptz, '2023-01-01T09:32:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553efdc726ad9951c238a7","original_client_name":"זנד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T13:19:25.466Z');
    END IF;

    -- לוג עבור: זוהר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26f66ed855b4d3a28' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-01T09:00:00Z'::timestamptz, '2023-01-01T09:15:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553d3ec8f8b58ae7ad0a59","original_client_name":"זוהר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T13:11:58.433Z');
    END IF;

    -- לוג עבור: זנד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e14a6146ca7c374455' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2023-01-01T09:00:00Z'::timestamptz, '2023-01-01T10:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553cdac0915653f841c0be","original_client_name":"זנד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T13:10:18.797Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'הגשת תיק מידע', '2023-01-01T09:00:00Z'::timestamptz, '2023-01-01T09:55:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69553ca9daa0f420aa643d96","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2023-01-01","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-31T13:09:29.065Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-12-18T09:00:00Z'::timestamptz, '2000-12-18T11:40:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b452a3c6599a34d83fc1","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-12-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:50:58.004Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-12-17T09:00:00Z'::timestamptz, '2000-12-17T09:51:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b3240dfbf01779661725","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-12-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:45:56.004Z');
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-12-16T09:00:00Z'::timestamptz, '2000-12-16T09:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b1a5898c2f479bb0b05c","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-12-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:39:33.091Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-12-15T09:00:00Z'::timestamptz, '2000-12-15T09:42:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b09a6761c571d6793b9f","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:35:06.329Z');
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-12-15T09:00:00Z'::timestamptz, '2000-12-15T12:28:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b0c6f83dae1848a2849f","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:35:50.251Z');
    END IF;

    -- לוג עבור: קולא
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dcb77b12ed2336d8cb' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-12-11T09:00:00Z'::timestamptz, '2000-12-11T10:54:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951af7a815b7058511ee632","original_client_name":"קולא","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-12-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:30:18.520Z');
    END IF;

    -- לוג עבור: שיף  יוסי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713d9b77b12ed2336d8c8' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-12-09T09:00:00Z'::timestamptz, '2000-12-09T09:36:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951ad6f84cb9f2f5cc82782","original_client_name":"שיף  יוסי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-12-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:21:35.855Z');
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-12-09T09:00:00Z'::timestamptz, '2000-12-09T09:13:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951adab0278752f5e8f1310","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-12-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:22:35.454Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-12-08T09:00:00Z'::timestamptz, '2000-12-08T09:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951ac102f14921f29836211","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-12-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:15:44.853Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-18T09:00:00Z'::timestamptz, '2000-01-18T09:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b4722f8f5f61232a3c78","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:51:30.343Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-18T09:00:00Z'::timestamptz, '2000-01-18T09:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b4330224b71c7b6b2d5f","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:50:27.629Z');
    END IF;

    -- לוג עבור: ליכטינשטיין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd4352a8d538799988' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-18T09:00:00Z'::timestamptz, '2000-01-18T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b3ffd5e55fa6c75f8d9a","original_client_name":"ליכטינשטיין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-18","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:49:35.865Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-17T09:00:00Z'::timestamptz, '2000-01-17T09:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b37f55505d7c57ddee9d","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.255Z"}'::jsonb, '2025-12-28T20:47:27.789Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-17T09:00:00Z'::timestamptz, '2000-01-17T12:34:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b3ad0278752f5e8f1921","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:48:13.003Z');
    END IF;

    -- לוג עבור: קוזלובסקי
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dd8f1cf0e47af1f1c5' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-17T09:00:00Z'::timestamptz, '2000-01-17T09:44:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b3525c8a18c7a0bd886c","original_client_name":"קוזלובסקי","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:46:42.306Z');
    END IF;

    -- לוג עבור: אהרונסון
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e788c6f664b1c2d40c' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-17T09:00:00Z'::timestamptz, '2000-01-17T10:13:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b3d807987efaa72c4bbc","original_client_name":"אהרונסון","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-17","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:48:56.764Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-16T09:00:00Z'::timestamptz, '2000-01-16T10:42:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b3014d59cc8ca1c32f81","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:45:21.703Z');
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-16T09:00:00Z'::timestamptz, '2000-01-16T10:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b1721219fdcfa293a41a","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-16","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:38:42.773Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-14T09:00:00Z'::timestamptz, '2000-01-14T12:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b065bdd3e22078fb0683","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:34:13.852Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-11T09:00:00Z'::timestamptz, '2000-01-11T14:45:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951af4aa826ea0494efeebe","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-11","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:29:30.597Z');
    END IF;

    -- לוג עבור: קולא
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dcb77b12ed2336d8cb' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-10T09:00:00Z'::timestamptz, '2000-01-10T14:12:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951aef2f5a183f71531b410","original_client_name":"קולא","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:28:02.965Z');
    END IF;

    -- לוג עבור: זייגן קטן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e26b42f16dc3687a76' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-10T09:00:00Z'::timestamptz, '2000-01-10T09:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951ae79716f1bb5df99656c","original_client_name":"זייגן קטן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:26:01.871Z');
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-09T09:00:00Z'::timestamptz, '2000-01-09T13:25:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951ad4084cb9f2f5cc8276e","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-09","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:20:48.977Z');
    END IF;

    -- לוג עבור: זנד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e14a6146ca7c374455' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-08T09:00:00Z'::timestamptz, '2000-01-08T13:30:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a7cc8465e49a8a6080f3","original_client_name":"זנד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T19:57:32.055Z');
    END IF;

    -- לוג עבור: זנד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e14a6146ca7c374455' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-08T09:00:00Z'::timestamptz, '2000-01-08T09:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a7874b3cf72d09783912","original_client_name":"זנד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T19:56:23.042Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb514bd90b0776d6dc1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-07T09:00:00Z'::timestamptz, '2000-01-07T14:16:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a70cb868c76c573347bd","original_client_name":"ווגנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T19:54:20.068Z');
    END IF;

    -- לוג עבור: הולצמן
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e319145780f8a9ca2f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-07T09:00:00Z'::timestamptz, '2000-01-07T10:20:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a730ed86e2b01e71e902","original_client_name":"הולצמן","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T19:54:56.682Z');
    END IF;

    -- לוג עבור: ווגנר
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e3970ee9e62bb09fcf' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '2000-01-07T09:00:00Z'::timestamptz, '2000-01-07T10:05:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951a76284cb9f2f5cc821ae","original_client_name":"ווגנר","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"2000-01-07","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T19:55:46.941Z');
    END IF;

    -- לוג עבור: הכהן יוסף יצחק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abb4cfe49fa64732bc0f' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '0024-09-10T09:00:00Z'::timestamptz, '0024-09-10T10:00:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69513f8dbc364711b03f6f27","original_client_name":"הכהן יוסף יצחק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"0024-09-10","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T12:32:45.791Z');
    END IF;

    -- לוג עבור: ברוד
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713e5ad835cd679788318' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '0024-06-26T09:00:00Z'::timestamptz, '0024-06-26T13:50:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b5b9d88eeef000fa8f1f","original_client_name":"ברוד","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"0024-06-26","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:56:57.441Z');
    END IF;

    -- לוג עבור: סלפושניק
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713dbcd803cc80e322502' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '0024-02-28T09:00:00Z'::timestamptz, '0024-02-28T10:33:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"69519f1f4b6bc93033b3a59a","original_client_name":"סלפושניק","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"0024-02-28","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T19:20:31.535Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '0002-12-15T09:00:00Z'::timestamptz, '0002-12-15T09:43:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b108513e4891180ad565","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"0002-12-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:36:56.155Z');
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '0002-01-15T09:00:00Z'::timestamptz, '0002-01-15T12:10:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b145cab4489a8dda1bad","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"0002-01-15","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:37:57.321Z');
    END IF;

    -- לוג עבור: ראובן אליאור ודורין
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713da40ef9a1433d4062e' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '0002-01-14T09:00:00Z'::timestamptz, '0002-01-14T11:51:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951b026a23f2296c573ba9d","original_client_name":"ראובן אליאור ודורין","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"0002-01-14","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:33:10.073Z');
    END IF;

    -- לוג עבור: לסאוף שמעון סטימן וג'ני יונה
    SELECT id INTO v_client_id FROM clients WHERE original_id = '694713ddc25aa6aaf8dbb8f2' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', '0002-01-08T09:00:00Z'::timestamptz, '0002-01-08T10:35:00.000Z'::timestamptz, true, NULL, false, ARRAY[]::text[], '{"original_id":"6951ac8eeac24886e1a1648f","original_client_name":"לסאוף שמעון סטימן וג''ני יונה","original_created_by_id":"693ac2f61358741aceefcb2c","original_user_email":null,"original_user_name":null,"original_log_date":"0002-01-08","imported_from":"backup","imported_at":"2026-01-27T20:23:18.256Z"}'::jsonb, '2025-12-28T20:17:50.309Z');
    END IF;

END $$;

-- סיכום
SELECT 'רישומי זמן יובאו:', COUNT(*) FROM time_entries WHERE (custom_data->>'imported_from') = 'backup';