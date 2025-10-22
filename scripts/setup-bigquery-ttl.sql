-- BigQuery 테이블 TTL 설정 (365일)
-- 실행: bq query --use_legacy_sql=false < scripts/setup-bigquery-ttl.sql

-- telemetry 테이블 기본 TTL 365일
ALTER TABLE `vibe.telemetry` 
SET OPTIONS (expiration_timestamp = TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL 365 DAY));

-- events 컬렉션 TTL (필요시)
-- ALTER TABLE `vibe.events` 
-- SET OPTIONS (expiration_timestamp = TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL 365 DAY));

-- outbox 컬렉션 TTL (필요시)
-- ALTER TABLE `vibe.outbox` 
-- SET OPTIONS (expiration_timestamp = TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL 90 DAY));
