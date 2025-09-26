// category.js  (ES Module)

import { createClient } from 'https://esm.sh/@supabase/supabase-js'

/* ================================
   Config & Bootstrap
================================ */
let supabase = null

/**
 * Dışarıdan çağrılan tek giriş noktası.
 * @param {Object} opts
 * @param {string} opts.supabaseUrl
 * @param {string} opts.supabaseKey
 * @param {string|HTMLElement} opts.target - Kategorilerin basılacağı container (selector veya element)
 * @param {function} [opts.onSelect] - Kategori seçildiğinde çalışacak callback (payload: {id, name, slug})
 * @param {boolean} [opts.autoSelectFirst=true] - İlk kategoriyi otomatik seç
 */
export async function initCategories(opts) {
  const {
    supabaseUrl,
    supabaseKey,
    target,
    onSelect,
    autoSelectFirst = true
  } = opts || {}

  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/KEY eksik')
  supabase = createClient(supabaseUrl, supabaseKey)

  const container = typeof target === 'string' ? document.querySelector(target) : target
  if (!container) throw new Error('Kategori container bulunamadı')

  const controller = new CategoryController({
    container,
    onSelect,
    autoSelectFirst
  })

  await controller.loadAndRender()
  return controller
}

/* ================================
   Service Layer (Data access)
================================ */
const CategoryService = {
  /**
   * Kategorileri çeker. Tablonda en az id, name (ve varsa slug) olmalı.
   * Kolonları ihtiyacına göre genişletebilirsin (image_url, is_active vs.)
   */
  async list() {
    const query = supabase
      .from('categories')
      .select('id, name, slug')
      .order('id', { ascending: true })


    const { data, error } = await query
    if (error) throw error

    // Güvenlik: null/undefined filtrele
    return (data || []).filter(Boolean)
  }
}

/* ================================
   UI Layer (DOM render)
================================ */
const CategoryUI = {
  renderSkeleton(container) {
    container.innerHTML = `
      <div class="cat-skeleton">
        <span class="sk-item"></span>
        <span class="sk-item"></span>
        <span class="sk-item"></span>
      </div>
    `
  },

  renderError(container, message = 'Kategoriler yüklenemedi.') {
    container.innerHTML = `
      <div class="cat-error" role="alert">${escapeHtml(message)}</div>
    `
  },

  /**
   * @param {HTMLElement} container
   * @param {Array<{id:number|string, name:string, slug?:string}>} categories
   */
  renderList(container, categories) {
    // Minimal ve esnek bir HTML çıktısı
    container.innerHTML = `
      <div class="category-list" role="list">
        ${categories
        .map(
          (c) => `
              <button class="category-chip" role="listitem"
                data-id="${String(c.id)}"
                data-name="${escapeAttr(c.name)}"
                data-slug="${escapeAttr(c.slug || '')}">
                ${escapeHtml(c.name)}
              </button>`
        )
        .join('')}
      </div>
    `
  },

  /**
   * Aktif seçimi görsel olarak işaretler
   */
  setActive(container, id) {
    const chips = container.querySelectorAll('.category-chip')
    chips.forEach((el) => {
      const isActive = el.dataset.id === String(id)
      el.classList.toggle('active', isActive)
      el.setAttribute('aria-current', isActive ? 'true' : 'false')
    })
  }
}

/* ================================
   Controller (Orkestrasyon)
================================ */
class CategoryController {
  constructor({ container, onSelect, autoSelectFirst }) {
    this.container = container
    this.onSelect = typeof onSelect === 'function' ? onSelect : null
    this.autoSelectFirst = autoSelectFirst
    this._categories = []
    this._boundClick = this._onClick.bind(this)
  }

  async loadAndRender() {
    try {
      CategoryUI.renderSkeleton(this.container)
      this._categories = await CategoryService.list()

      if (!this._categories.length) {
        CategoryUI.renderError(this.container, 'Hiç kategori bulunamadı.')
        return
      }

      CategoryUI.renderList(this.container, this._categories)

      // Event delegation
      this.container.removeEventListener('click', this._boundClick)
      this.container.addEventListener('click', this._boundClick)

      if (this.autoSelectFirst) {
        const first = this._categories[0]
        this.select(first.id)
      }
    } catch (err) {
      console.error('Kategori yükleme hatası:', err)
      CategoryUI.renderError(this.container, 'Kategoriler yüklenirken bir hata oluştu.')
    }
  }

  /**
   * Programatik seçim
   */
  select(id) {
    const found = this._categories.find((c) => String(c.id) === String(id));
    if (!found) return;

    // ✅ Aktif class'ı her zaman güncelle (kullanıcı belki stil bozmuştur)
    CategoryUI.setActive(this.container, found.id);

    // ✅ Her zaman callback tetikle (önceden seçilmiş olsa bile!)
    this._emitSelection(found);
  }


  /**
   * Dışarıya public API: Dinleyici ekle
   */
  onSelection(cb) {
    if (typeof cb === 'function') this.onSelect = cb
  }

  _onClick(e) {
    const btn = e.target.closest('.category-chip');
    if (!btn) return;

    const clickedId = String(btn.dataset.id);

    // Her zaman callback'i tetikle
    const found = this._categories.find(c => String(c.id) === clickedId);
    if (found) {
      CategoryUI.setActive(this.container, found.id); // Görsel olarak seç
      this._emitSelection(found); // Callback'i gönder
    }
  }


  _emitSelection(category) {
    // Callback
    if (this.onSelect) {
      try {
        this.onSelect({ id: category.id, name: category.name, slug: category.slug || '' })
      } catch (e) {
        console.warn('onSelect callback error:', e)
      }
    }
    // CustomEvent: sayfada başka yerler dinleyebilir
    const ev = new CustomEvent('category:selected', {
      detail: { id: category.id, name: category.name, slug: category.slug || '' }
    })
    this.container.dispatchEvent(ev)
  }
}

/* ================================
   Minimal CSS (opsiyonel)
   - İstersen kendi stylesheet’ine taşı.
================================ */
injectOnce('category-css', `
  .cat-skeleton { display:flex; gap:.5rem; }
  .cat-skeleton .sk-item {
    display:inline-block; width:84px; height:34px;
    border-radius:999px; opacity:.35; background:currentColor;
    animation: pulse 1.2s infinite ease-in-out;
  }
  @keyframes pulse {
    0%, 100% { opacity:.35; }
    50% { opacity:.15; }
  }


`)

/* ================================
   Utilities
================================ */
function injectOnce(id, cssText) {
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = cssText
  document.head.appendChild(style)
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeAttr(str = '') {
  // Attribute context için basitleştirilmiş kaçış
  return escapeHtml(str).replaceAll('`', '&#96;')
}




