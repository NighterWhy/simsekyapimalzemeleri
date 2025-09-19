/***** product-detail.js *****/

/* ====== 0) Yardımcılar ====== */
const qs = (s) => document.querySelector(s);
const getParam = (k) => new URLSearchParams(location.search).get(k);

const PRODUCT_ID = getParam('id');
const PRODUCT_SLUG = getParam('slug'); // ister id ister slug

/* ====== 1) Supabase Client ====== */
const SUPABASE_URL = "https://csvvtsheawphgghosryx.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdnZ0c2hlYXdwaGdnaG9zcnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTEzMTEsImV4cCI6MjA3MjU2NzMxMX0.ph12Klr8Ee4pM3l2fnz2ciAuvKv2gGMxAF9Twwm6l8Y";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ====== 2) DOM Hedefleri ====== */
const els = {
  title: qs('#productTitle'),
  mainImage: qs('#mainImage'),
  categoryLink: qs('#categoryLink'),
  variantTbody: qs('#variantTbody'),
  description: qs('#productDescription'),
};

/* Açıklamayı gizle (istenmediği için) */
if (els.description) {
  const h2 = els.description.previousElementSibling;
  if (h2?.tagName === 'H2') h2.style.display = 'none';
  els.description.style.display = 'none';
}

/* Storage yolu → tam public URL dönüştürücü */
function toPublicURL(pathOrFull) {
  if (!pathOrFull) return null;
  if (/^https?:\/\//i.test(pathOrFull)) return pathOrFull;
  return `${SUPABASE_URL}/storage/v1/object/public/${String(pathOrFull).replace(/^\/+/, '')}`;
}

/* ====== 3) Render ====== */
function renderBasic({ name, image_url }, categoryName, categoryKey) {
  els.title.textContent = name || 'Ürün';

  const img = image_url ? toPublicURL(image_url) : null;
  els.mainImage.src = img || 'assets/img/products/product2.png';
  els.mainImage.alt = name || 'Ürün görseli';
  els.mainImage.addEventListener('error', () => {
    els.mainImage.src = 'assets/img/products/product2.png';
  });

  if (els.categoryLink) {
    els.categoryLink.textContent = categoryName || 'Kategori';
    els.categoryLink.href = categoryKey
      ? `urunler.html?category=${encodeURIComponent(categoryKey)}`
      : 'urunler.html';
  }

  document.title = `${name || 'Ürün Detayı'} | Şimşek Yapı`;
  const whatsappBtn = document.querySelector('#whatsappBtn');
  if (whatsappBtn) {
    const phone = "+905413851170"; // senin WhatsApp numaran
    const message = `Merhaba, ${name || 'ürün'} hakkında daha fazla bilgi almak istiyorum.`;
    whatsappBtn.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

}

function renderVariants(rows) {
  if (!rows?.length) {
    els.variantTbody.innerHTML = `<tr><td colspan="2" class="text-muted">Varyant bulunamadı.</td></tr>`;
    return;
  }
  els.variantTbody.innerHTML = rows.map(v => `
    <tr>
      <td>${v.size ?? '-'}</td>
      <td>${v.package_qty ?? '-'}</td>
    </tr>
  `).join('');
}

/* ====== 4) Veri Çekme ====== */
(async function init() {
  try {
    // Parametre doğrulama (id NaN olmasın)
    const hasSlug = !!(PRODUCT_SLUG && PRODUCT_SLUG.trim());
    const idNum = Number(PRODUCT_ID);
    const hasValidId = PRODUCT_ID !== null && PRODUCT_ID !== '' && Number.isFinite(idNum);

    if (!hasSlug && !hasValidId) {
      throw new Error('Geçerli bir id veya slug parametresi bekleniyor (ör. ?id=1 veya ?slug=pvc-u-boru-b-tipi).');
    }

    // ÜRÜN
    let q = supabase
      .from('products')
      .select('id, slug, name, category_id, image_url')
      .limit(1);

    if (hasSlug) q = q.eq('slug', PRODUCT_SLUG);
    else if (hasValidId) q = q.eq('id', idNum); // int8 → number

    const { data: pRows, error: pErr } = await q;
    if (pErr) throw pErr;
    const product = pRows?.[0];
    if (!product) throw new Error('Ürün bulunamadı.');

    // KATEGORİ
    let categoryName = 'Kategori', categoryKey = product.category_id;
    if (product.category_id) {
      const { data: cat, error: catErr } = await supabase
        .from('categories')
        .select('name, slug, id')
        .eq('id', product.category_id)
        .single();
      if (!catErr && cat) {
        categoryName = cat.name || categoryName;
        categoryKey = cat.slug || cat.id;
      }
    }

    // VARYANTLAR (tablo: products_variants)
    const { data: variants, error: varErr } = await supabase
      .from('products_variants')
      .select('size, package_qty')
      .eq('product_id', product.id)

    if (varErr) console.warn('Varyant okunamadı:', varErr?.message);

    // DOM
    renderBasic(product, categoryName, categoryKey);
    renderVariants(variants || []);
  } catch (e) {
    console.error(e);
    els.title.textContent = 'Ürün Bulunamadı';
    els.variantTbody.innerHTML = `<tr><td colspan="2" class="text-danger">Tablo yüklenemedi.</td></tr>`;
  }

})();
