import { supabase, SUPABASE_URL, SUPABASE_KEY } from './supabase.js';
import { initCategories } from './category.js';

const PRODUCTS_PER_PAGE = 12;
let currentPage = 1;
let allProducts = [];
let catController = null;

export async function setupProductsPage() {
  const container = document.getElementById("productGrid");
  container.innerHTML = "";
  document.getElementById("pagination").style.display = "none";


  const selectedSlug = new URLSearchParams(location.search).get("category");

  // Kategori modülünü başlat
  catController = await initCategories({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_KEY,
    target: '#categoryList',
    autoSelectFirst: false,
    onSelect: async (cat) => {
      document.getElementById("pagination").style.display = "block"; // 👈 burası eklendi
      history.pushState(null, '', `?category=${cat.slug}`);
      const { data: products, error } = await supabase
        .from("products")
        .select("id, slug, name, image_url")
        .eq("category_id", cat.id)
        .order("id", { ascending: true }); // ✅ burada da tamam

      if (error) {
        container.innerHTML = `<p class="text-danger">Ürünler yüklenemedi.</p>`;
        return;
      }

      allProducts = products;
      currentPage = 1;
      renderProductsPage();
    }
  });

  // Sayfa ilk yüklendiğinde hangi kategori seçili?
  if (selectedSlug) {
    const all = catController._categories;
    const found = all.find(c => c.slug === selectedSlug);
    if (found) await catController.select(found.id);

  } else {
    await showAllCategories();
  }

  // Başlığa tıklanınca tüm kategorileri tekrar göster
  document.getElementById("kategoriBaslik").addEventListener("click", showAllCategories);


}

function renderProductsPage() {
  const container = document.getElementById("productGrid");
  container.innerHTML = "";

  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE;
  const pageItems = allProducts.slice(start, end);

  if (pageItems.length === 0) {
    container.innerHTML = `<p class="text-muted">Bu kategoride ürün bulunamadı.</p>`;
    return;
  }

  for (const product of pageItems) {
    container.innerHTML += `
      <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="200">
        <div class="project-card">
          <div class="project-image">
            <img src="${product.image_url}" alt="${product.name}" class="img-fluid">
            <div class="project-overlay">
              <div class="project-actions">
                <a href="urun-detay.html?slug=${encodeURIComponent(product.slug)}" class="btn-project">Detay</a>
              </div>
            </div>
          </div>
          <div class="project-info">
            <h3>${product.name}</h3>
          </div>
        </div>
      </div>
    `;
  }

  renderPagination();
  // ✅ Sayfa değişince ürünler bölümüne kaydır
  const section = document.getElementById("projects");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);

  // ✅ Ürün yoksa pagination'ı tamamen gizle
  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  }

  // ✅ Ürün varsa görünür yap
  pagination.style.display = "block";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "page-btn active" : "page-btn";
    btn.addEventListener("click", () => {
      currentPage = i;
      renderProductsPage();
    });
    pagination.appendChild(btn);
  }
}


async function showAllCategories() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, slug, name, image_url')
    .order('id', { ascending: true });

  const container = document.getElementById("productGrid");
  container.innerHTML = '';
  allProducts = []; // 👉 bu satır eksik!


  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  pagination.style.display = "none";

  for (const cat of categories) {
    container.innerHTML += `
      <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="200">
        <div class="project-card category-card" data-category-id="${cat.id}">
          <div class="project-image">
            <img src="${cat.image_url}" alt="${cat.name}" class="img-fluid">
            <div class="project-overlay">
              <div class="project-actions">
                <span class="btn-project">Ürünleri Göster</span>
              </div>
            </div>
          </div>
          <div class="project-info">
            <h3>${cat.name}</h3>
          </div>
        </div>
      </div>
    `;
  }

  // Kartlara tıklama bağla
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', async () => {
      const catId = parseInt(card.dataset.categoryId);
      if (!catController) return;
      catController.select(catId);
      // 1️ Her zaman kategori verisini bul
      const category = catController._categories.find(c => c.id == catId);
      if (!category) return;

      // 2️ UI'de aktif olarak göster
      CategoryUI.setActive(document.getElementById('categoryList'), category.id);

      // 3️ Ürünleri Supabase'ten çek
      const { data: products, error } = await supabase
        .from("products")
        .select("id, slug, name, image_url")
        .eq("category_id", category.id)
        .order('id',{ascending : true});

      if (error) {
        console.error("Ürünler çekilemedi:", error);
        return;
      }

      // 4️ Listeyi güncelle ve sayfayı 1’e al
      allProducts = products;
      currentPage = 1;
      renderProductsPage();

      // 5️ URL’yi güncelle
      history.pushState(null, '', `?category=${category.slug}`);

      // 6️ Scroll animasyonu
      window.scrollTo({
        top: document.getElementById("projects").offsetTop - 100,
        behavior: 'smooth'
      });
    });
  });
  await catController.loadAndRender();



}
