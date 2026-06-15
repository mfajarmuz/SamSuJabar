-- migrations/001_initial.sql

CREATE TABLE IF NOT EXISTS outlets (
    id   SERIAL PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    aktif BOOLEAN DEFAULT true
);

INSERT INTO outlets (kode, nama) VALUES
    ('12801-0001', 'Outlet Salebu'),
    ('12801-0002', 'Outlet Ciawi'),
    ('12801-0003', 'Outlet Karangnunggal'),
    ('12801-0004', 'Kios Samsat Singaparna'),
    ('12801-0005', 'Samdong 2'),
    ('12801-0006', 'Samades Manonjaya'),
    ('12801-0007', 'Samkel 3'),
    ('12801-0008', 'Samkel 2'),
    ('12808-0001', 'SAMKEL 1-SUKARAJA')
ON CONFLICT (kode) DO NOTHING;

CREATE TABLE IF NOT EXISTS laporan_harian (
    id          SERIAL PRIMARY KEY,
    outlet_id   INTEGER NOT NULL REFERENCES outlets(id),
    tanggal     DATE NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by VARCHAR(100),
    sam_file    VARCHAR(255),
    rekap_file  VARCHAR(255),
    sts_file    VARCHAR(255),
    status      VARCHAR(20) DEFAULT 'partial',
    UNIQUE(outlet_id, tanggal)
);

CREATE TABLE IF NOT EXISTS transaksi_sam (
    id              SERIAL PRIMARY KEY,
    laporan_id      INTEGER NOT NULL REFERENCES laporan_harian(id) ON DELETE CASCADE,
    no_skkp         VARCHAR(50),
    no_polisi       VARCHAR(20),
    jenis_kendaraan VARCHAR(10),
    pkb             BIGINT DEFAULT 0,
    bbnkb           BIGINT DEFAULT 0,
    swdkllj         BIGINT DEFAULT 0,
    adm             BIGINT DEFAULT 0,
    total           BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rekap_kasir (
    id            SERIAL PRIMARY KEY,
    laporan_id    INTEGER NOT NULL REFERENCES laporan_harian(id) ON DELETE CASCADE,
    nama_kasir    VARCHAR(100),
    total_wp      INTEGER DEFAULT 0,
    total_pkb     BIGINT DEFAULT 0,
    total_bbnkb   BIGINT DEFAULT 0,
    total_swdkllj BIGINT DEFAULT 0,
    total_adm     BIGINT DEFAULT 0,
    grand_total   BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sts_setoran (
    id         SERIAL PRIMARY KEY,
    laporan_id INTEGER NOT NULL REFERENCES laporan_harian(id) ON DELETE CASCADE,
    instansi   VARCHAR(50),
    pkb        BIGINT DEFAULT 0,
    bbnkb      BIGINT DEFAULT 0,
    swdkllj    BIGINT DEFAULT 0,
    adm        BIGINT DEFAULT 0,
    total      BIGINT DEFAULT 0
);
