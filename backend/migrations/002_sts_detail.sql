-- migrations/002_sts_detail.sql

ALTER TABLE sts_setoran ADD COLUMN IF NOT EXISTS kode VARCHAR(10);
ALTER TABLE sts_setoran ADD COLUMN IF NOT EXISTS nama VARCHAR(100);

CREATE TABLE IF NOT EXISTS sts_kabkota_detail (
    id         SERIAL PRIMARY KEY,
    laporan_id INTEGER NOT NULL REFERENCES laporan_harian(id) ON DELETE CASCADE,
    kode       VARCHAR(10),
    nama       VARCHAR(100),
    pkb_pokok  BIGINT DEFAULT 0,
    pkb_denda  BIGINT DEFAULT 0,
    opsen_pkb_denda BIGINT DEFAULT 0,
    opsen_pkb  BIGINT DEFAULT 0,
    jumlah     BIGINT DEFAULT 0
);

-- Add indexes for frequently queried foreign keys
CREATE INDEX IF NOT EXISTS idx_transaksi_sam_laporan_id ON transaksi_sam(laporan_id);
CREATE INDEX IF NOT EXISTS idx_rekap_kasir_laporan_id ON rekap_kasir(laporan_id);
CREATE INDEX IF NOT EXISTS idx_sts_setoran_laporan_id ON sts_setoran(laporan_id);
CREATE INDEX IF NOT EXISTS idx_sts_kabkota_detail_laporan_id ON sts_kabkota_detail(laporan_id);
