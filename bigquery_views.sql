-- BigQuery 뷰 생성 스크립트
-- dataset: vibe

-- 1) 일자별 퍼널
CREATE OR REPLACE VIEW `vibe.v_daily_funnel` AS
WITH regs AS (
  SELECT
    _PARTITIONTIME AS pt,
    eventId,
    REGEXP_EXTRACT(_DOCUMENT_NAME, r'registrations/([^/]+)$') AS registrationId,
    JSON_VALUE(_raw, '$.status') AS status,
    TIMESTAMP(JSON_VALUE(_raw, '$.confirmedAt._seconds')||' '||JSON_VALUE(_raw, '$.confirmedAt._nanoseconds')) AS confirmed_ts
  FROM `vibe.firestore_export_events___registrations_raw_latest`
),
outb AS (
  SELECT
    _PARTITIONTIME AS pt,
    REGEXP_EXTRACT(_DOCUMENT_NAME, r'events/([^/]+)/') AS eventId,
    REGEXP_EXTRACT(_DOCUMENT_NAME, r'outbox/([^/]+)$') AS outboxId,
    JSON_VALUE(_raw,'$.type') AS type,
    TIMESTAMP(JSON_VALUE(_raw,'$.createdAt._seconds')||' '||JSON_VALUE(_raw,'$.createdAt._nanoseconds')) AS created_ts,
    JSON_VALUE(_raw,'$.registrationId') AS registrationId,
    JSON_VALUE(_raw,'$.ack.email.ok') AS email_ok,
    JSON_VALUE(_raw,'$.ack.fcm.ok') AS fcm_ok,
    TIMESTAMP(JSON_VALUE(_raw,'$.ack.email.at._seconds')||' '||JSON_VALUE(_raw,'$.ack.email.at._nanoseconds')) AS email_at,
    TIMESTAMP(JSON_VALUE(_raw,'$.ack.fcm.at._seconds')||' '||JSON_VALUE(_raw,'$.ack.fcm.at._nanoseconds')) AS fcm_at
  FROM `vibe.firestore_export_events___outbox_raw_latest`
)
SELECT
  DATE(created_ts) AS dt,
  COUNTIF(type='PAYMENT_CONFIRMED') AS confirmed_events,
  COUNTIF(type='PAYMENT_CONFIRMED' AND email_ok='true') AS email_ok,
  COUNTIF(type='PAYMENT_CONFIRMED' AND fcm_ok='true') AS fcm_ok,
  APPROX_QUANTILES(TIMESTAMP_DIFF(COALESCE(email_at,fcm_at), created_ts, SECOND), 5)[OFFSET(1)] AS p25_sla_sec,
  APPROX_QUANTILES(TIMESTAMP_DIFF(COALESCE(email_at,fcm_at), created_ts, SECOND), 5)[OFFSET(3)] AS p75_sla_sec
FROM outb
GROUP BY dt
ORDER BY dt DESC;

-- 2) 이벤트별 체크인 전환율
CREATE OR REPLACE VIEW `vibe.v_event_checkin_rate` AS
WITH regs AS (
  SELECT
    REGEXP_EXTRACT(_DOCUMENT_NAME, r'events/([^/]+)/') AS eventId,
    REGEXP_EXTRACT(_DOCUMENT_NAME, r'registrations/([^/]+)$') AS registrationId,
    JSON_VALUE(_raw,'$.status') AS status,
    JSON_VALUE(_raw,'$.checkedInAt._seconds') AS checked_in_sec
  FROM `vibe.firestore_export_events___registrations_raw_latest`
)
SELECT
  eventId,
  COUNTIF(status='confirmed') AS confirmed_cnt,
  COUNTIF(checked_in_sec IS NOT NULL) AS checkedin_cnt,
  SAFE_DIVIDE(COUNTIF(checked_in_sec IS NOT NULL), NULLIF(COUNTIF(status='confirmed'),0)) AS checkin_rate
FROM regs
GROUP BY eventId
ORDER BY checkin_rate DESC;

-- 3) 텔레메트리 분석 (스캔 성공/실패)
CREATE OR REPLACE VIEW `vibe.v_telemetry_scan` AS
SELECT
  DATE(TIMESTAMP(JSON_VALUE(_raw, '$.at._seconds')||' '||JSON_VALUE(_raw, '$.at._nanoseconds'))) AS dt,
  JSON_VALUE(_raw, '$.t') AS event_type,
  JSON_VALUE(_raw, '$.payload.eventId') AS eventId,
  JSON_VALUE(_raw, '$.payload.code') AS error_code,
  COUNT(*) AS count
FROM `vibe.firestore_export_telemetry_raw_latest`
WHERE JSON_VALUE(_raw, '$.t') IN ('scan_ok', 'scan_err')
GROUP BY dt, event_type, eventId, error_code
ORDER BY dt DESC, count DESC;

-- 4) 팬아웃 성능 분석
CREATE OR REPLACE VIEW `vibe.v_fanout_performance` AS
SELECT
  DATE(TIMESTAMP(JSON_VALUE(_raw,'$.createdAt._seconds')||' '||JSON_VALUE(_raw,'$.createdAt._nanoseconds'))) AS dt,
  JSON_VALUE(_raw,'$.type') AS fanout_type,
  COUNT(*) AS total_sent,
  COUNTIF(JSON_VALUE(_raw,'$.ack.email.ok')='true') AS email_success,
  COUNTIF(JSON_VALUE(_raw,'$.ack.fcm.ok')='true') AS fcm_success,
  AVG(TIMESTAMP_DIFF(
    TIMESTAMP(JSON_VALUE(_raw,'$.ack.email.at._seconds')||' '||JSON_VALUE(_raw,'$.ack.email.at._nanoseconds')),
    TIMESTAMP(JSON_VALUE(_raw,'$.createdAt._seconds')||' '||JSON_VALUE(_raw,'$.createdAt._nanoseconds')),
    SECOND
  )) AS avg_email_delay_sec,
  AVG(TIMESTAMP_DIFF(
    TIMESTAMP(JSON_VALUE(_raw,'$.ack.fcm.at._seconds')||' '||JSON_VALUE(_raw,'$.ack.fcm.at._nanoseconds')),
    TIMESTAMP(JSON_VALUE(_raw,'$.createdAt._seconds')||' '||JSON_VALUE(_raw,'$.createdAt._nanoseconds')),
    SECOND
  )) AS avg_fcm_delay_sec
FROM `vibe.firestore_export_events___outbox_raw_latest`
WHERE JSON_VALUE(_raw,'$.type') = 'PAYMENT_CONFIRMED'
GROUP BY dt, fanout_type
ORDER BY dt DESC;
