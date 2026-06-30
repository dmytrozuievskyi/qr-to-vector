window.QRApp = window.QRApp || {};

window.QRApp.i18n = (function() {
  const translations = {
    en: {
      "subtitle": "engraving vector tool",
      "sec_input": "Input Image",
      "drop_text": "drop / click / paste",
      "sec_crop": "Crop Image",
      "sec_recognition": "Recognition",
      "lbl_autofind": "Auto-find & warp QR",
      "tip_autofind": "Automatically locate and perspective-correct the QR code",
      "lbl_forceinvert": "Force invert",
      "tip_forceinvert": "Manually swap black/white modules",
      "lbl_recreate": "Recreate from data",
      "tip_recreate": "Scans the image and generates a perfect vector from scratch. Best for messy images.",
      "sec_geometry": "Geometry",
      "sec_matrix": "Grid Matrix",
      "lbl_centermask": "Center Mask",
      "tip_centermask": "Masks out the center cells for QRs with embedded logos. Disabled for non-square grids.",
      "sec_polygons": "Polygons",
      "lbl_cellgap": "Cell Gap",
      "tip_cellgap": "Scales individual cells before merging. Values over 0 create gaps.",
      "lbl_thickness": "Thickness",
      "lbl_shrink": "Shrink / Expand",
      "tip_shrink": "Shrinks or expands the vector polygons for engraving tolerances",
      "lbl_cornerstyle": "Round/Cut Corners",
      "tip_cornerstyle": "Toggle between smooth rounded corners or sharp chamfered cuts",
      "lbl_cornerbevel": "Bevel Amount",
      "tip_cornerbevel": "Controls the radius of the corner rounding or chamfer",
      "sec_output": "Output",
      "lbl_manualgrid": "Manual Grid Override",
      "tip_manualgrid": "Bypass auto-detection and force a specific NxM grid size",
      "lbl_outsize": "Output Size",
      "btn_process": "Process",
      "btn_update": "Update",
      "btn_export": "Export",
      "stg_import": "import",
      "stg_crop": "crop",
      "stg_threshold": "threshold",
      "stg_matrix": "matrix",
      "stg_polygons": "polygons",
      "stg_export": "export",
      "lbl_original": "Original",
      "lbl_diff": "Diff",
      "lbl_opacity": "Opacity",
      "btn_crop_confirm": "Crop & Use",
      "btn_crop_skip": "Use Full Image",
      "btn_next": "Next",
      "btn_recreate_data": "Recreate from Data",
      "btn_cancel_recreate": "Cancel Recreation",
      "tip_recreate_data": "Regenerates the output vector from the QR's decoded data instead of the traced image — produces a mathematically perfect result when tracing gives a bad match.",
      "lbl_grid_w": "Grid W",
      "lbl_grid_h": "Grid H",
      "lbl_out_w": "Width",
      "lbl_out_h": "Height",
      "lbl_out_unit": "Unit",
      "lbl_out_format": "Format",
      "lbl_v_waiting": "Waiting for generation...",
      "lbl_orig_data": "Original Data",
      "lbl_out_data": "Output Data",
      "lbl_v_passed": "Verification Passed",
      "lbl_v_fail_gen": "Could not scan generated QR",
      "lbl_v_scan_out": "Output is scannable (Original was not)",
      "lbl_v_mismatch": "Data mismatch!",
      "lbl_v_fail_both": "Neither QR could be scanned",
      "lbl_v_recreated": "Generated from Scanned Data",
      "tip_cancel_recreate": "Cancels the data-driven generation and returns to tracing the image.",
      "lbl_crop_select": "Select area to crop"
    },
    uk: {
      "subtitle": "векторний інструмент для гравіювання",
      "sec_input": "Вхідне зображення",
      "drop_text": "перетягніть / натисніть / вставте",
      "sec_crop": "Обрізка зображення",
      "sec_recognition": "Розпізнавання",
      "lbl_autofind": "Авто-пошук і вирівн.",
      "tip_autofind": "Автоматичний пошук та корекція перспективи QR коду",
      "lbl_forceinvert": "Примусове інвертування",
      "tip_forceinvert": "Ручна заміна чорних/білих модулів",
      "lbl_recreate": "Відтворити з даних",
      "tip_recreate": "Сканує зображення та генерує ідеальний вектор з нуля. Найкраще для пошкоджених зображень.",
      "sec_geometry": "Геометрія",
      "sec_matrix": "Сітка матриці",
      "lbl_centermask": "Маскування центру",
      "tip_centermask": "Маскує центральні клітинки для QR-кодів із вбудованим логотипом. Вимкнено для непрямокутних сіток.",
      "sec_polygons": "Полігони",
      "lbl_cellgap": "Проміжок між клітинок",
      "tip_cellgap": "Масштабує окремі клітинки перед об'єднанням. Значення більше 0 створюють проміжки.",
      "lbl_thickness": "Товщина",
      "lbl_shrink": "Звуження / Розширення",
      "tip_shrink": "Звужує або розширює векторні полігони для допусків гравіювання",
      "lbl_cornerstyle": "Округлі/Зрізані кути",
      "tip_cornerstyle": "Перемикання між плавно закругленими або різко зрізаними кутами",
      "lbl_cornerbevel": "Розмір зрізу",
      "tip_cornerbevel": "Контролює радіус закруглення або зрізу кутів",
      "sec_output": "Вивід",
      "lbl_manualgrid": "Ручна сітка",
      "tip_manualgrid": "Обійти авто-визначення та застосувати власну сітку NxM",
      "lbl_outsize": "Вихідний розмір",
      "btn_process": "Обробити",
      "btn_update": "Оновити",
      "btn_export": "Експортувати",
      "stg_import": "імпорт",
      "stg_crop": "обрізка",
      "stg_threshold": "поріг",
      "stg_matrix": "матриця",
      "stg_polygons": "полігони",
      "stg_export": "експорт",
      "lbl_original": "Оригінал",
      "lbl_diff": "Різниця",
      "lbl_opacity": "Непрозорість",
      "btn_crop_confirm": "Використати область",
      "btn_crop_skip": "Повне зображення",
      "btn_next": "Далі",
      "btn_recreate_data": "Відтворити з даних",
      "btn_cancel_recreate": "Скасувати відтворення",
      "tip_recreate_data": "Перегенерує вихідний вектор з декодованих даних QR замість трасованого зображення — дає математично точний результат, якщо трасування дало погане співпадіння.",
      "lbl_grid_w": "Ширина сітки",
      "lbl_grid_h": "Висота сітки",
      "lbl_out_w": "Ширина",
      "lbl_out_h": "Висота",
      "lbl_out_unit": "Одиниці",
      "lbl_out_format": "Формат",
      "lbl_v_waiting": "Очікування генерації...",
      "lbl_orig_data": "Оригінальні дані",
      "lbl_out_data": "Вихідні дані",
      "lbl_v_passed": "Перевірка пройдена",
      "lbl_v_fail_gen": "Не вдалося відсканувати згенерований QR",
      "lbl_v_scan_out": "Вихідний файл читається (Оригінал не читався)",
      "lbl_v_mismatch": "Невідповідність даних!",
      "lbl_v_fail_both": "Жоден QR не вдалося відсканувати",
      "lbl_v_recreated": "Згенеровано з відсканованих даних",
      "tip_cancel_recreate": "Скасовує генерацію на основі даних і повертається до трасування зображення.",
      "lbl_crop_select": "Виділіть область для обрізки"
    }
  };

  let currentLang = 'en';

  function setLanguage(lang) {
    if (!translations[lang]) return;
    if (lang === currentLang) return;
    currentLang = lang;

    
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const dict = translations[lang];

    function applyText() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (!dict[key]) return;
        if (el.querySelector('*')) {
          setTextPreservingChildren(el, dict[key]);
        } else {
          el.textContent = dict[key];
        }
      });
      if (window.QRApp.ui && window.QRApp.state) {
        window.QRApp.ui.updateMainButton(window.QRApp.state.actionState);
      }
    }

    fadeSwap(applyText);
  }

  
  
  let fadeToken = null;
  function fadeSwap(applyFn) {
    const overlay = document.getElementById('lang-fade-overlay');
    if (!overlay) { applyFn(); return; }

    const FADE_MS = 500;

    if (fadeToken) fadeToken.cancelled = true;
    const token = { cancelled: false };
    fadeToken = token;

    overlay.classList.add('visible');

    setTimeout(() => {
      if (token.cancelled) return;
      applyFn();
      setTimeout(() => {
        if (token.cancelled) return;
        overlay.classList.remove('visible');
      }, 60); 
    }, FADE_MS);
  }

  
  
  function setTextPreservingChildren(el, newText) {
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = newText;
        return;
      }
    }
    
    el.insertBefore(document.createTextNode(newText), el.firstChild);
  }

  function get(key) {
    return translations[currentLang][key] || key;
  }

  return { setLanguage, get, currentLang: () => currentLang };
})();
