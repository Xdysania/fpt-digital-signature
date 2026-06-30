/**
 * FPT 数字签名 — 通用交互（对齐 Figma Intesi CA 流程）
 */
(function () {
  'use strict';

  /**
   * 初始化自定义下拉
   * @param {HTMLElement} wrap
   */
  function initSel(wrap) {
    var t = wrap.querySelector('.strg');
    var m = wrap.querySelector('.smen');
    var v = wrap.querySelector('.strg-v');
    var opts = Array.from(m.querySelectorAll('.sopt'));

    function close() {
      wrap.classList.remove('is-open');
      t.setAttribute('aria-expanded', 'false');
      m.setAttribute('hidden', '');
    }

    function open() {
      document.querySelectorAll('.swrap.is-open').forEach(function (o) {
        if (o !== wrap) {
          o.classList.remove('is-open');
          o.querySelector('.strg').setAttribute('aria-expanded', 'false');
          o.querySelector('.smen').setAttribute('hidden', '');
        }
      });
      wrap.classList.add('is-open');
      t.setAttribute('aria-expanded', 'true');
      m.removeAttribute('hidden');
    }

    function select(opt) {
      var val = opt.getAttribute('data-value');
      var txt = opt.querySelector('span').textContent.trim();
      opts.forEach(function (o) {
        o.classList.remove('is-sel');
        o.setAttribute('aria-selected', 'false');
      });
      opt.classList.add('is-sel');
      opt.setAttribute('aria-selected', 'true');
      v.textContent = txt;
      wrap.setAttribute('data-value', val);
      wrap.dispatchEvent(new CustomEvent('sel:change', { bubbles: true, detail: { value: val, text: txt } }));
      close();
    }

    t.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      wrap.classList.contains('is-open') ? close() : open();
    });
    opts.forEach(function (o) {
      o.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        select(o);
      });
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
  }

  /**
   * 同步联系方式单选图标
   * @param {ParentNode} root
   */
  function syncMethodCardIcons(root) {
    root.querySelectorAll('[data-fpt-method]').forEach(function (card) {
      var icon = card.querySelector('.h5-verify-method-card__radio');
      if (!icon) return;
      icon.src = card.classList.contains('is-sel')
        ? '../assets/h5/icons/icon-radio-selected.svg'
        : '../assets/h5/icons/icon-radio-unselected.svg';
    });
  }

  /**
   * 同步认证联系方式对应输入框显隐
   * @param {ParentNode} root
   * @param {'email'|'phone'} method
   */
  function syncContactFields(root, method) {
    var emailField = root.querySelector('[data-fpt-email-field]');
    var phoneField = root.querySelector('[data-fpt-phone-field]');
    if (emailField) emailField.hidden = method !== 'email';
    if (phoneField) phoneField.hidden = method !== 'phone';
    syncMethodCardIcons(root);
  }

  /**
   * 初始化认证联系方式切换
   */
  function initContactMethod() {
    document.querySelectorAll('.modal, .h5-auth-body, .fpt-auth-form, .h5-phone, .h5-verify-body, .h5-panel--auth').forEach(function (root) {
      var selected = root.querySelector('[data-fpt-method].is-sel');
      if (selected) {
        syncContactFields(root, selected.getAttribute('data-fpt-method'));
      }
    });

    document.querySelectorAll('[data-fpt-method]').forEach(function (card) {
      card.addEventListener('click', function () {
        var method = card.getAttribute('data-fpt-method');
        var root = card.closest('.modal, .h5-auth-body, .fpt-auth-form, .h5-phone, .h5-verify-body, .h5-panel--auth') || document;
        root.querySelectorAll('[data-fpt-method]').forEach(function (c) {
          c.classList.remove('is-sel');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('is-sel');
        card.setAttribute('aria-checked', 'true');
        syncContactFields(root, method);
      });
    });
  }

  /**
   * 初始化 H5 单选列表（供应商等多选项场景，Figma 913:175824）
   * @param {HTMLElement} wrap
   */
  function initH5RadioList(wrap) {
    var items = Array.from(wrap.querySelectorAll('.h5-radio-list__item'));
    if (!items.length) return;

    var selectedIcon = '../assets/h5/icons/icon-radio-selected.svg';
    var unselectedIcon = '../assets/h5/icons/icon-radio-unselected.svg';

    /**
     * @param {HTMLElement} item
     */
    function selectItem(item) {
      items.forEach(function (it) {
        var selected = it === item;
        it.classList.toggle('is-selected', selected);
        it.setAttribute('aria-checked', selected ? 'true' : 'false');
        var icon = it.querySelector('.h5-radio-list__icon img');
        if (icon) icon.src = selected ? selectedIcon : unselectedIcon;
      });
      var value = item.getAttribute('data-value') || '';
      var label = item.querySelector('.h5-radio-list__label');
      wrap.setAttribute('data-value', value);
      if (!wrap.classList.contains('h5-radio-list--picker')) {
        wrap.dispatchEvent(new CustomEvent('h5-supplier:change', {
          bubbles: true,
          detail: { value: value, text: label ? label.textContent.trim() : '' }
        }));
      }
    }

    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        selectItem(item);
      });
    });
  }

  /**
   * 签署页供应商选择：主面板下拉展示 + 底部单选列表弹层（Figma 23108 + 913）
   * @param {HTMLElement} wrap
   */
  function initH5SupplierPickerSheet(wrap) {
    var sheetId = wrap.getAttribute('data-picker-sheet');
    var sheet = sheetId ? document.getElementById(sheetId) : null;
    var trigger = wrap.querySelector('.h5-supplier-select__trigger');
    var valueEl = wrap.querySelector('.h5-supplier-select__value');
    var pickerList = sheet ? sheet.querySelector('.h5-radio-list') : null;
    var confirmBtn = sheet ? sheet.querySelector('[id$="-picker-confirm"]') : null;
    var mask = sheet ? sheet.querySelector('.h5-picker-sheet__mask') : null;
    if (!sheet || !trigger || !pickerList) return;

    var selectedIcon = '../assets/h5/icons/icon-radio-selected.svg';
    var unselectedIcon = '../assets/h5/icons/icon-radio-unselected.svg';

    /**
     * @param {string} value
     */
    function syncPickerSelection(value) {
      pickerList.setAttribute('data-value', value);
      pickerList.querySelectorAll('.h5-radio-list__item').forEach(function (item) {
        var selected = item.getAttribute('data-value') === value;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-checked', selected ? 'true' : 'false');
        var icon = item.querySelector('.h5-radio-list__icon img');
        if (icon) icon.src = selected ? selectedIcon : unselectedIcon;
      });
    }

    function openSheet() {
      syncPickerSelection(wrap.getAttribute('data-value') || pickerList.getAttribute('data-value') || '');
      sheet.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }

    function closeSheet() {
      sheet.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openSheet();
    });

    if (mask) {
      mask.addEventListener('click', function () {
        closeSheet();
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        var selected = pickerList.querySelector('.h5-radio-list__item.is-selected');
        if (!selected) return;
        var value = selected.getAttribute('data-value') || '';
        var label = selected.querySelector('.h5-radio-list__label');
        wrap.setAttribute('data-value', value);
        if (valueEl && label) valueEl.textContent = label.textContent.trim();
        wrap.dispatchEvent(new CustomEvent('h5-supplier:change', {
          bubbles: true,
          detail: { value: value, text: label ? label.textContent.trim() : '' }
        }));
        closeSheet();
      });
    }
  }

  /**
   * 初始化 H5 供应商下拉
   * @param {HTMLElement} wrap
   */
  function initH5SupplierSelect(wrap) {
    var trigger = wrap.querySelector('.h5-supplier-select__trigger');
    var dropdown = wrap.querySelector('.h5-supplier-select__dropdown');
    var valueEl = wrap.querySelector('.h5-supplier-select__value');
    var options = Array.from(wrap.querySelectorAll('.h5-supplier-select__option'));
    if (!trigger || !dropdown || !valueEl) return;

    function close() {
      dropdown.classList.remove('is-open');
      trigger.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    function open() {
      document.querySelectorAll('.h5-supplier-select__dropdown.is-open').forEach(function (d) {
        if (d !== dropdown) {
          d.classList.remove('is-open');
          var t = d.parentElement && d.parentElement.querySelector('.h5-supplier-select__trigger');
          if (t) {
            t.classList.remove('is-open');
            t.setAttribute('aria-expanded', 'false');
          }
        }
      });
      dropdown.classList.add('is-open');
      trigger.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function selectOption(option) {
      options.forEach(function (o) { o.classList.remove('is-selected'); });
      option.classList.add('is-selected');
      valueEl.textContent = option.textContent.trim();
      wrap.setAttribute('data-value', option.getAttribute('data-value') || '');
      wrap.dispatchEvent(new CustomEvent('h5-supplier:change', {
        bubbles: true,
        detail: { value: option.getAttribute('data-value'), text: option.textContent.trim() }
      }));
      close();
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.contains('is-open') ? close() : open();
    });
    options.forEach(function (option) {
      option.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        selectOption(option);
      });
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
  }

  /**
   * 初始化 H5 签署页交互
   */
  function initH5SigningPage() {
    var app = document.getElementById('h5-app');
    if (!app) return;

    var providers = {
      fpt: {
        logo: '../assets/images/fpt-is-logo.svg',
        region: '支持国家/区域：越南',
        desc: 'FPT 是越南本地数字签名认证服务提供商，提供个人与企业数字签名、数字证书及身份认证服务，支持电子合同、税务、海关、电子发票、社保等越南本地合规交易场景。'
      },
      intesi: {
        logo: '../assets/images/fpt-is-logo.svg',
        region: '支持国家/区域：Europe',
        desc: 'Intesi provides compliant European digital signature services based on AATL and CSC standards, supporting users with CA-issued personal digital certificates to complete secure document signing in Nota Sign.'
      },
      cloud: {
        logo: '../assets/images/fpt-is-logo.svg',
        region: '支持国家/区域：Global',
        desc: 'Cloud Digital Signature provides secure, scalable signing services via cloud-based infrastructure.'
      }
    };

    function updateSupplierCard(val) {
      var data = providers[val];
      if (!data) return;
      var logo = document.querySelector('#h5-supplier-card .h5-supplier-card__logo img');
      var region = document.getElementById('h5-supplier-region');
      var desc = document.getElementById('h5-supplier-desc');
      if (logo) logo.src = data.logo;
      if (region) region.textContent = data.region;
      if (desc) desc.textContent = data.desc;
    }

    var supplierSelect = document.getElementById('h5-supplier-select');
    if (supplierSelect) {
      supplierSelect.addEventListener('h5-supplier:change', function (e) {
        updateSupplierCard(e.detail.value);
      });
      updateSupplierCard(supplierSelect.getAttribute('data-value') || 'fpt');
    }

    var sigDropdown = document.getElementById('h5-sig-dropdown');
    var moreBtn = document.getElementById('h5-more');
    if (moreBtn && sigDropdown) {
      moreBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        sigDropdown.classList.toggle('is-visible');
      });
      document.addEventListener('click', function () {
        sigDropdown.classList.remove('is-visible');
      });
    }

    var overlay = document.getElementById('h5-overlay');
    var panel = document.getElementById('h5-panel');
    var submitBtn = document.getElementById('h5-submit');
    var closeBtn = document.getElementById('h5-close');

    function showPanel() {
      if (overlay) overlay.hidden = false;
      if (panel) panel.hidden = false;
    }

    function hidePanel() {
      if (overlay) overlay.hidden = true;
      if (panel) panel.hidden = true;
    }

    if (submitBtn) submitBtn.addEventListener('click', showPanel);
    if (closeBtn) closeBtn.addEventListener('click', hidePanel);

    var nextBtn = document.getElementById('h5-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        window.location.href = 'auth-info.html';
      });
    }

    var authSubmit = document.getElementById('h5-auth-submit');
    if (authSubmit) {
      authSubmit.addEventListener('click', function () {
        window.location.href = 'cert-querying.html';
      });
    }

    var authClose = document.getElementById('h5-auth-close');
    if (authClose) {
      authClose.addEventListener('click', function () {
        window.location.href = 'signing.html';
      });
    }

    if (panel && !panel.hidden) showPanel();
  }

  /**
   * 初始化 CA 供应商卡片切换
   */
  function initCaProviderCard() {
    var wrap = document.getElementById('sel-sign');
    if (!wrap) return;

    var providers = {
      fpt: {
        logo: '../assets/images/fpt-is-logo.svg',
        region: '支持国家/区域：越南',
        desc: 'FPT 是越南本地数字签名认证服务提供商，提供个人与企业数字签名、数字证书及身份认证服务，支持电子合同、税务、海关、电子发票、社保等越南本地合规交易场景。'
      },
      intesi: {
        logo: '../assets/images/ca-logo-intesi-ref.png',
        region: '支持国家/区域：Europe',
        desc: 'Intesi provides compliant European digital signature services based on AATL and CSC standards, supporting users with CA-issued personal digital certificates to complete secure document signing in Nota Sign.'
      },
      cloud: {
        logo: '../assets/images/ca-logo-intesi-ref.png',
        region: '支持国家/区域：Global',
        desc: 'Cloud Digital Signature provides secure, scalable signing services via cloud-based infrastructure.'
      }
    };

    function updateCard(val) {
      var data = providers[val];
      var card = document.getElementById('pcard');
      if (!data || !card) return;
      var img = card.querySelector('img');
      var rg = card.querySelector('.pcard-rg');
      var ds = card.querySelector('.pcard-ds');
      if (img) { img.src = data.logo; img.alt = val === 'fpt' ? 'FPT IS' : val; }
      if (rg) rg.textContent = data.region;
      if (ds) ds.textContent = data.desc;
    }

    wrap.addEventListener('sel:change', function (e) {
      updateCard(e.detail.value);
    });
    updateCard(wrap.getAttribute('data-value') || 'fpt');
  }

  /**
   * 初始化 H5 CA 列表切换
   */
  function initH5CaList() {
    document.querySelectorAll('[data-h5-ca-opt]').forEach(function (opt) {
      opt.addEventListener('click', function () {
        document.querySelectorAll('[data-h5-ca-opt]').forEach(function (o) {
          o.classList.remove('is-sel');
        });
        opt.classList.add('is-sel');
        var label = document.querySelector('[data-h5-ca-label]');
        if (label) label.textContent = opt.querySelector('span').textContent;
        var list = document.getElementById('h5-ca-list');
        var intro = document.getElementById('h5-ca-intro');
        if (list && intro) {
          list.hidden = true;
          intro.hidden = false;
        }
      });
    });
    var expand = document.getElementById('h5-ca-expand');
    if (expand) {
      expand.addEventListener('click', function () {
        var list = document.getElementById('h5-ca-list');
        var intro = document.getElementById('h5-ca-intro');
        if (list && intro) {
          intro.hidden = true;
          list.hidden = false;
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.swrap').forEach(initSel);
    document.querySelectorAll('.h5-radio-list').forEach(initH5RadioList);
    document.querySelectorAll('.h5-supplier-select[data-picker-sheet]').forEach(initH5SupplierPickerSheet);
    document.querySelectorAll('.h5-supplier-select:not([data-picker-sheet])').forEach(initH5SupplierSelect);
    initContactMethod();
    initCaProviderCard();
    initH5CaList();
    initH5SigningPage();
  });
})();
