-- migrations/002_sts_detail.sql

ALTER TABLE sts_setoran ADD COLUMN IF NOT EXISTS kode VARCHAR(10);
ALTER TABLE sts_setoran ADD COLUMN IF NOT EXISTS nama VARCHAR(100);

CREATE TABLE IF NOT EXISTS sts_kabkota_detail (
    id         SERIAL PRIMARY KEY,
    laporan_id INTEGER NOT NULL REFERENCES laporan_harian(id) ON DELETE CASCADE,
    kode       VARCHAR(10),
    nama       VARCHAR(100),
    opsen_pkb  BIGINT DEFAULT 0,
    jumlah     BIGINT DEFAULT 0
);
