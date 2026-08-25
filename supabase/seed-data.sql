-- ============================================================================
-- NexusTop — SEED DATA (run AFTER supabase/setup.sql)
--
-- Pre-loads: website settings (site config), API key placeholders, roulette
-- config, games, products, banners, and events — so your Supabase project is
-- ready to use immediately. Safe to re-run (guarded with NOT EXISTS).
--
-- After this, control everything from the Supabase Table Editor:
--   - settings  → key='site' holds website name, contact, SEO, favicon, social
--   - settings  → key='secret_*' holds the API keys (fill in real values)
--   - games / products → your catalog
-- ============================================================================

-- ---------- Site settings (dedicated table — edit each cell directly) ----------
INSERT INTO site_settings (id, name, tagline, description, keywords, updated_at)
VALUES (1, 'NexusTop', 'Top-Up Game Tercepat & Terpercaya',
'Top up game favoritmu dalam hitungan detik. Proses otomatis 24/7 dengan harga terbaik, loyalty tier, dan event menarik. Bayar dengan QRIS, e-wallet, Virtual Account, atau saldo dompet.',
'top up game, top up game termurah, diamond mobile legends, diamond free fire, uc pubg mobile, genshin impact crystals, valorant vp, nexustop, top up saldo, voucher game',
now())
ON CONFLICT (id) DO NOTHING;

-- ---------- Legacy website settings (key = 'site') — kept for backward compat ----------
INSERT INTO settings (key, value, updated_at)
VALUES ('site', '{"name":"NexusTop","tagline":"Top-Up Game Tercepat & Terpercaya","description":"Top up game favoritmu dalam hitungan detik. Proses otomatis 24/7 dengan harga terbaik, loyalty tier, dan event menarik. Bayar dengan QRIS, e-wallet, Virtual Account, atau saldo dompet.","keywords":["top up game","top up game termurah","diamond mobile legends","diamond free fire","uc pubg mobile","genshin impact crystals","valorant vp","nexustop","top up saldo","voucher game"],"faviconUrl":"/favicon.svg","ogImageUrl":"/banners/flash-sale.jpg","logoUrl":null,"supportEmail":"support@nexustop.id","whatsapp":"6281234567890","phone":"","address":"","currency":"IDR","locale":"id-ID","themeColor":"#2563EB","social":{"instagram":"https://instagram.com","tiktok":"https://tiktok.com","twitter":"https://twitter.com","facebook":"https://facebook.com","youtube":"https://youtube.com","discord":"https://discord.com","whatsapp":"6281234567890"},"welcomePopup":{"enabled":true,"imageUrl":"/banners/flash-sale.jpg","title":"Selamat Datang di NexusTop!","subtitle":"Top up game favoritmu lebih cepat & dapat Spin Credit di setiap transaksi. Cek Flash Sale kami sekarang!","ctaText":"Lihat Flash Sale","ctaLink":"/#flash-sale"}}', now())
ON CONFLICT (key) DO NOTHING;

-- ---------- API key placeholders (fill real values in Table Editor) ----------
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_openrouter_api_key', '', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_apigames_merchant_id', '', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_apigames_secret', '', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_sekalipay_api_key', '', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_midtrans_server_key', '', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_midtrans_snap_url', 'https://app.sandbox.midtrans.com/snap/v1/transactions', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_midtrans_status_url', 'https://api.sandbox.midtrans.com/v2', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_resend_api_key', '', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_resend_from', 'NexusTop <noreply@nexustop.id>', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_fonnte_token', '', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_telegram_bot_token', '', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_telegram_chat_id', '', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('secret_admin_api_key', '', now())
ON CONFLICT (key) DO NOTHING;

-- ---------- Roulette prizes & credit rate ----------
INSERT INTO settings (key, value, updated_at)
VALUES ('roulette_prizes', '[{"segment":1,"label":"Cashback Rp500","type":"cashback","value":500,"probability":0.3,"color":"#2563EB"},{"segment":2,"label":"Diskon 2%","type":"voucher_pct","value":2,"maxDiscount":1000,"probability":0.2,"color":"#06B6D4"},{"segment":3,"label":"Cashback Rp1.000","type":"cashback","value":1000,"probability":0.15,"color":"#8B5CF6"},{"segment":4,"label":"+1 Spin Credit","type":"credit","value":1,"probability":0.15,"color":"#0EA5E9"},{"segment":5,"label":"Diskon 5%","type":"voucher_pct","value":5,"maxDiscount":2000,"probability":0.1,"color":"#6366F1"},{"segment":6,"label":"Cashback Rp2.500","type":"cashback","value":2500,"probability":0.06,"color":"#7C3AED"},{"segment":7,"label":"Coba lagi","type":"none","value":0,"probability":0.02,"color":"#475569"},{"segment":8,"label":"JACKPOT Diskon 10%","type":"voucher_pct","value":10,"maxDiscount":10000,"probability":0.02,"color":"#F59E0B"}]', now())
ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value, updated_at)
VALUES ('credit_per_rupiah', '5000', now())
ON CONFLICT (key) DO NOTHING;

-- ---------- Games ----------
INSERT INTO games (name, slug, publisher, image_url, category, needs_server_id, id_field_label, server_field_label, id_placeholder, description, is_active, sort_order, created_at)
VALUES
('Mobile Legends', 'mobile-legends', 'Moonton', 'https://images.pexels.com/photos/9072394/pexels-photo-9072394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'MOBA', true, 'User ID', 'Zone ID', 'Contoh: 123456789', 'Top up Diamond Mobile Legends: Bang Bang. Masukkan User ID dan Zone ID dari profil in-game.', true, 0, now()),
('Free Fire', 'free-fire', 'Garena', 'https://images.pexels.com/photos/11450707/pexels-photo-11450707.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Battle Royale', false, 'ID Player', 'Server', 'Contoh: 123456789', 'Top up Diamond Free Fire. Cukup masukkan ID Player yang tertera pada profil akun.', true, 1, now()),
('PUBG Mobile', 'pubg-mobile', 'Tencent', 'https://images.pexels.com/photos/17266184/pexels-photo-17266184.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Shooter', false, 'Character ID', 'Server', 'Contoh: 5123456789', 'Top up Unknown Cash (UC) PUBG Mobile. Masukkan Character ID dari profil kamu.', true, 2, now()),
('Genshin Impact', 'genshin-impact', 'HoYoverse', 'https://images.pexels.com/photos/12551746/pexels-photo-12551746.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'RPG', false, 'UID', 'Server', 'Contoh: 812345678', 'Top up Genesis Crystal Genshin Impact. Masukkan UID dan pilih server.', true, 3, now()),
('Honkai Impact 3rd', 'honkai-impact', 'HoYoverse', 'https://images.pexels.com/photos/37421708/pexels-photo-37421708.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'RPG', false, 'UID', 'Server', 'Contoh: 112345678', 'Top up Crystal Honkai Impact 3rd. Masukkan UID akun kamu.', true, 4, now()),
('Valorant', 'valorant', 'Riot Games', 'https://images.pexels.com/photos/3678428/pexels-photo-3678428.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Shooter', false, 'Riot ID', 'Region', 'Contoh: Player#TAG', 'Top up Valorant Points (VP). Masukkan Riot ID lengkap dengan tagline.', true, 5, now()),
('Call of Duty Mobile', 'cod-mobile', 'Activision', 'https://images.pexels.com/photos/6841030/pexels-photo-6841030.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Shooter', false, 'ID Player', 'Server', 'Contoh: 1234567890', 'Top up CP (COD Points) Call of Duty Mobile. Masukkan ID Player.', true, 6, now()),
('Honkai: Star Rail', 'honkai-star-rail', 'HoYoverse', 'https://images.pexels.com/photos/32417608/pexels-photo-32417608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'RPG', false, 'UID', 'Server', 'Contoh: 812345678', 'Top up Oneiric Shard Honkai: Star Rail. Masukkan UID dan pilih server.', true, 7, now()),
('Token Listrik (PLN)', 'token-listrik', 'PLN', 'https://images.pexels.com/photos/2883028/pexels-photo-2883028.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Pulsa & Tagihan', false, 'ID Pelanggan / Meter', 'Server', 'Contoh: 12345678901', 'Beli token listrik prabayar PLN. Masukkan ID Pelanggan atau nomor meter.', true, 8, now()),
('Pulsa & Paket Data', 'pulsa-data', 'All Operator', 'https://images.pexels.com/photos/7773732/pexels-photo-7773732.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'Pulsa & Tagihan', false, 'Nomor HP', 'Operator', 'Contoh: 0812xxxxxxxx', 'Isi pulsa dan paket data semua operator. Masukkan nomor HP tujuan.', true, 9, now())
ON CONFLICT (slug) DO NOTHING;

-- ---------- Products ----------
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'MLBB-86', '86 Diamonds', '86', 22000, 'apigames', true, 0, now(), now() FROM games WHERE slug = 'mobile-legends'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'MLBB-86' AND game_id = (SELECT id FROM games WHERE slug = 'mobile-legends'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'MLBB-172', '172 Diamonds', '172', 44000, 'apigames', true, 1, now(), now() FROM games WHERE slug = 'mobile-legends'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'MLBB-172' AND game_id = (SELECT id FROM games WHERE slug = 'mobile-legends'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'MLBB-257', '257 Diamonds', '257', 66000, 'apigames', true, 2, now(), now() FROM games WHERE slug = 'mobile-legends'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'MLBB-257' AND game_id = (SELECT id FROM games WHERE slug = 'mobile-legends'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'MLBB-WL', 'Weekly Diamond Pass', 'Mingguan', 28000, 'apigames', true, 3, now(), now() FROM games WHERE slug = 'mobile-legends'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'MLBB-WL' AND game_id = (SELECT id FROM games WHERE slug = 'mobile-legends'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'FF-70', '70 Diamonds', '70', 10000, 'apigames', true, 4, now(), now() FROM games WHERE slug = 'free-fire'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'FF-70' AND game_id = (SELECT id FROM games WHERE slug = 'free-fire'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'FF-355', '355 Diamonds', '355', 50000, 'apigames', true, 5, now(), now() FROM games WHERE slug = 'free-fire'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'FF-355' AND game_id = (SELECT id FROM games WHERE slug = 'free-fire'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'FF-720', '720 Diamonds', '720', 99000, 'apigames', true, 6, now(), now() FROM games WHERE slug = 'free-fire'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'FF-720' AND game_id = (SELECT id FROM games WHERE slug = 'free-fire'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'FF-MMB', 'Membership Mingguan', 'Mingguan', 30000, 'apigames', true, 7, now(), now() FROM games WHERE slug = 'free-fire'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'FF-MMB' AND game_id = (SELECT id FROM games WHERE slug = 'free-fire'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'PUBG-60', '60 UC', '60', 14500, 'apigames', true, 8, now(), now() FROM games WHERE slug = 'pubg-mobile'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PUBG-60' AND game_id = (SELECT id FROM games WHERE slug = 'pubg-mobile'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'PUBG-325', '325 UC', '325', 74000, 'apigames', true, 9, now(), now() FROM games WHERE slug = 'pubg-mobile'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PUBG-325' AND game_id = (SELECT id FROM games WHERE slug = 'pubg-mobile'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'PUBG-660', '660 UC', '660', 145000, 'apigames', true, 10, now(), now() FROM games WHERE slug = 'pubg-mobile'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PUBG-660' AND game_id = (SELECT id FROM games WHERE slug = 'pubg-mobile'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'GI-60', '60 Crystals', '60', 16000, 'apigames', true, 11, now(), now() FROM games WHERE slug = 'genshin-impact'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'GI-60' AND game_id = (SELECT id FROM games WHERE slug = 'genshin-impact'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'GI-330', '330 Crystals', '330', 79000, 'apigames', true, 12, now(), now() FROM games WHERE slug = 'genshin-impact'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'GI-330' AND game_id = (SELECT id FROM games WHERE slug = 'genshin-impact'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'HI-70', '70 Buku', '70', 15000, 'apigames', true, 13, now(), now() FROM games WHERE slug = 'honkai-impact'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'HI-70' AND game_id = (SELECT id FROM games WHERE slug = 'honkai-impact'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'VL-100', '100 VP', '100', 14000, 'sekalipay', true, 14, now(), now() FROM games WHERE slug = 'valorant'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'VL-100' AND game_id = (SELECT id FROM games WHERE slug = 'valorant'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'VL-475', '475 VP', '475', 58000, 'sekalipay', true, 15, now(), now() FROM games WHERE slug = 'valorant'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'VL-475' AND game_id = (SELECT id FROM games WHERE slug = 'valorant'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'COD-80', '80 CP', '80', 15000, 'apigames', true, 16, now(), now() FROM games WHERE slug = 'cod-mobile'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'COD-80' AND game_id = (SELECT id FROM games WHERE slug = 'cod-mobile'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'HI-SR-60', '60 Oneiric Shard', '60', 16000, 'sekalipay', true, 17, now(), now() FROM games WHERE slug = 'honkai-star-rail'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'HI-SR-60' AND game_id = (SELECT id FROM games WHERE slug = 'honkai-star-rail'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'PLN-50', 'Token PLN 50.000', 'Rp50.000', 50500, 'sekalipay', true, 18, now(), now() FROM games WHERE slug = 'token-listrik'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PLN-50' AND game_id = (SELECT id FROM games WHERE slug = 'token-listrik'));
INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)
SELECT id, 'PULSA-25', 'Pulsa Rp25.000', 'Rp25.000', 25000, 'sekalipay', true, 19, now(), now() FROM games WHERE slug = 'pulsa-data'
AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PULSA-25' AND game_id = (SELECT id FROM games WHERE slug = 'pulsa-data'));

-- ---------- Banners ----------
INSERT INTO banners (image_url, title, subtitle, cta_text, cta_link, sort_order, is_active, created_at)
VALUES
('/banners/flash-sale.jpg', 'Flash Sale Spesial', 'Diskon hingga 20% untuk diamond & UC favoritmu. Terbatas!', 'Belanja Sekarang', '/#flash-sale', 0, true, now()),
('/banners/deposit.jpg', 'Deposit Saldo, Lebih Cepat', 'Simpan saldo sekali, top-up tanpa repot bayar berulang.', 'Isi Saldo', '/balance', 1, true, now()),
('/banners/roulette.jpg', 'Spin & Menangkan Hadiah', 'Setiap transaksi sukses memberimu Spin Credit di Event Roulette.', 'Coba Roulette', '/event', 2, true, now())
ON CONFLICT DO NOTHING;

-- ---------- Exclusive events (Hadiah) ----------
INSERT INTO events (title, description, banner_image, start_date, end_date, tier_visibility, credit_cost, event_type, config, status, created_at)
VALUES
('Weekly Spend Leaderboard', 'Bertanding dengan pengeluaran top-up mingguanmu. Top 3 memenangkan voucher + bonus Spin Credit!', '/banners/deposit.jpg', now(), now() + interval '30 days', 'both', 0, 'leaderboard', '{"prizePool":150000,"topN":3}', 'active', now()),
('Mystery Box: Silver & Gold', 'Tukar 2 Spin Credit untuk membuka Mystery Box. Langganan = Silver Box, Sultan = Gold Box dengan hadiah lebih besar.', '/banners/roulette.jpg', now(), now() + interval '30 days', 'both', 2, 'mystery_box', '{"silver":["Voucher Rp2.000","+1 Credit","Cashback Rp1.000"],"gold":["Voucher Rp5.000","+2 Credit","Cashback Rp3.000","Diskon 5%"]}', 'active', now()),
('Login Streak Bonus', 'Check-in gratis setiap hari. Kumpulkan streak hingga hari ke-7, 14, dan 30 untuk bonus bertahap.', '/banners/flash-sale.jpg', now(), now() + interval '30 days', 'both', 0, 'login_streak', '{"milestones":{"7":1,"14":2,"30":5}}', 'active', now())
ON CONFLICT DO NOTHING;

-- ---------- Flash sales ----------
INSERT INTO flash_sales (product_id, discount_type, discount_value, start_at, end_at, stock_limit, sold_count, status, created_at)
SELECT id, 'percentage', 10, now() - interval '1 hour', now() + interval '2 days', 40, 0, 'active', now() FROM products WHERE sku = 'FF-70'
AND NOT EXISTS (SELECT 1 FROM flash_sales WHERE product_id = (SELECT id FROM products WHERE sku = 'FF-70'));
INSERT INTO flash_sales (product_id, discount_type, discount_value, start_at, end_at, stock_limit, sold_count, status, created_at)
SELECT id, 'fixed', 1500, now() - interval '1 hour', now() + interval '2 days', 25, 0, 'active', now() FROM products WHERE sku = 'MLBB-86'
AND NOT EXISTS (SELECT 1 FROM flash_sales WHERE product_id = (SELECT id FROM products WHERE sku = 'MLBB-86'));
INSERT INTO flash_sales (product_id, discount_type, discount_value, start_at, end_at, stock_limit, sold_count, status, created_at)
SELECT id, 'percentage', 8, now() - interval '1 hour', now() + interval '2 days', 30, 0, 'active', now() FROM products WHERE sku = 'PUBG-60'
AND NOT EXISTS (SELECT 1 FROM flash_sales WHERE product_id = (SELECT id FROM products WHERE sku = 'PUBG-60'));

-- ---------- News (Berita) ----------
INSERT INTO news (title, excerpt, content, image_url, category, is_published, pinned, created_at, updated_at)
VALUES
('Flash Sale Spesial Akhir Pekan!', 'Diskon hingga 20% untuk diamond & UC favoritmu selama akhir pekan ini.', 'Nikmati diskon spesial akhir pekan untuk berbagai game populer! Dapatkan diamond Mobile Legends, UC PUBG Mobile, dan banyak lagi dengan harga lebih murah. Promo berlaku terbatas, jangan sampai terlewat!', '/banners/flash-sale.jpg', 'Promo', true, true, now(), now()),
('Spin Credit Gratis di Setiap Transaksi', 'Kumpulkan Spin Credit dari setiap top-up sukses dan tukarkan di Event Roulette.', 'Setiap transaksi top-up sukses minimal Rp5.000 memberi kamu Spin Credit. Kumpulkan dan tukarkan di halaman Event untuk kesempatan memenangkan cashback, voucher diskon, hingga jackpot! Semakin sering top-up, semakin banyak peluang menang.', '/banners/roulette.jpg', 'Info', true, false, now() - interval '1 day', now() - interval '1 day'),
('Naik Tier, Dapat Harga Lebih Murah', 'Capai belanja Rp150.000/bulan untuk naik ke Langganan dan dapat diskon 2%.', 'Sistem loyalty member kami memberi harga lebih murah untuk member setia. Capai total belanja Rp150.000 dalam sebulan untuk naik ke tier Langganan (diskon 2%), atau Rp500.000 untuk Sultan (diskon 3.5%). Plus akses ke event Hadiah eksklusif!', '/banners/deposit.jpg', 'Info', true, false, now() - interval '2 days', now() - interval '2 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Done. Edit any of these rows directly in the Supabase Table Editor:
--   - Table "settings", key = 'site'  → website name, contact, SEO, favicon, social links
--   - Table "settings", key = 'secret_*' → paste your real API keys
--   - Tables "games" / "products" → manage your catalog
--   - Tables "banners" / "events" / "flash_sales" → manage promotions
-- ============================================================================
