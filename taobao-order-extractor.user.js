// ==UserScript==
// @name         淘宝订单提取器
// @namespace    https://github.com/sfdye/taobao-order-extractor
// @version      1.3
// @description  提取最近一周淘宝订单信息，格式化为TSV方便粘贴到腾讯文档
// @author       sfdye
// @match        *://buyertrade.taobao.com/trade/itemlist/*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      h5api.m.taobao.com
// ==/UserScript==

(function () {
  'use strict';

  const DAYS_TO_LOOK_BACK = 7;

  function formatLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function simplifyItemName(name) {
    let s = name;
    s = s.replace(/[【\[（(][^】\]）)]*[】\]）)]\s*/g, '');
    s = s.replace(/正品/g, '');
    s = s.trim();
    if (s.length <= 20) return s;
    const spaceIdx = s.indexOf(' ', 10);
    if (spaceIdx > 0 && spaceIdx <= 20) return s.substring(0, spaceIdx);
    return s.substring(0, 20);
  }

  function getCutoffStr() {
    const now = new Date();
    return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - DAYS_TO_LOOK_BACK));
  }

  function isNewVersion() {
    return document.querySelectorAll('[id^="shopOrderContainer_"]').length > 0;
  }

  function createButton() {
    const btn = document.createElement('div');
    btn.id = 'taobao-order-extractor-btn';
    btn.innerHTML = '📋 提取本周订单';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '80px',
      right: '30px',
      zIndex: '99999',
      padding: '12px 20px',
      background: '#ff5000',
      color: '#fff',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      userSelect: 'none',
    });
    btn.addEventListener('click', extractOrders);
    btn.addEventListener('mouseenter', () => { btn.style.background = '#e04800'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#ff5000'; });
    document.body.appendChild(btn);
    return btn;
  }

  function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '999999',
      padding: '12px 24px',
      background: '#333',
      color: '#fff',
      borderRadius: '6px',
      fontSize: '14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  // --- MD5 implementation for mtop signing ---
  function md5(string) {
    function rotateLeft(val, shift) { return (val << shift) | (val >>> (32 - shift)); }
    function addUnsigned(x, y) {
      const x8 = x & 0x80000000, y8 = y & 0x80000000;
      const x4 = x & 0x40000000, y4 = y & 0x40000000;
      const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
      if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
      if (x4 | y4) {
        if (result & 0x40000000) return result ^ 0xC0000000 ^ x8 ^ y8;
        return result ^ 0x40000000 ^ x8 ^ y8;
      }
      return result ^ x8 ^ y8;
    }
    function F(x, y, z) { return (x & y) | (~x & z); }
    function G(x, y, z) { return (x & z) | (y & ~z); }
    function H(x, y, z) { return x ^ y ^ z; }
    function I(x, y, z) { return y ^ (x | ~z); }
    function FF(a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
    function GG(a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
    function HH(a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
    function II(a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
    function convertToWordArray(str) {
      const len = str.length;
      const numWords = (((len + 8) >>> 6) + 1) * 16;
      const wordArray = new Array(numWords - 1);
      for (let i = 0; i < numWords; i++) wordArray[i] = 0;
      for (let i = 0; i < len; i++) wordArray[i >>> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
      wordArray[len >>> 2] |= 0x80 << ((len % 4) * 8);
      wordArray[numWords - 2] = len << 3;
      return wordArray;
    }
    function wordToHex(val) {
      let result = '';
      for (let i = 0; i <= 3; i++) {
        const byte = (val >>> (i * 8)) & 255;
        result += ('0' + byte.toString(16)).slice(-2);
      }
      return result;
    }
    const encoded = encodeURIComponent(string);
    const utf8 = encoded.replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)));
    const x = convertToWordArray(utf8);
    let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    for (let k = 0; k < x.length; k += 16) {
      const AA = a, BB = b, CC = c, DD = d;
      a = FF(a, b, c, d, x[k+0], 7, 0xD76AA478); d = FF(d, a, b, c, x[k+1], 12, 0xE8C7B756);
      c = FF(c, d, a, b, x[k+2], 17, 0x242070DB); b = FF(b, c, d, a, x[k+3], 22, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[k+4], 7, 0xF57C0FAF); d = FF(d, a, b, c, x[k+5], 12, 0x4787C62A);
      c = FF(c, d, a, b, x[k+6], 17, 0xA8304613); b = FF(b, c, d, a, x[k+7], 22, 0xFD469501);
      a = FF(a, b, c, d, x[k+8], 7, 0x698098D8); d = FF(d, a, b, c, x[k+9], 12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[k+10], 17, 0xFFFF5BB1); b = FF(b, c, d, a, x[k+11], 22, 0x895CD7BE);
      a = FF(a, b, c, d, x[k+12], 7, 0x6B901122); d = FF(d, a, b, c, x[k+13], 12, 0xFD987193);
      c = FF(c, d, a, b, x[k+14], 17, 0xA679438E); b = FF(b, c, d, a, x[k+15], 22, 0x49B40821);
      a = GG(a, b, c, d, x[k+1], 5, 0xF61E2562); d = GG(d, a, b, c, x[k+6], 9, 0xC040B340);
      c = GG(c, d, a, b, x[k+11], 14, 0x265E5A51); b = GG(b, c, d, a, x[k+0], 20, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[k+5], 5, 0xD62F105D); d = GG(d, a, b, c, x[k+10], 9, 0x02441453);
      c = GG(c, d, a, b, x[k+15], 14, 0xD8A1E681); b = GG(b, c, d, a, x[k+4], 20, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[k+9], 5, 0x21E1CDE6); d = GG(d, a, b, c, x[k+14], 9, 0xC33707D6);
      c = GG(c, d, a, b, x[k+3], 14, 0xF4D50D87); b = GG(b, c, d, a, x[k+8], 20, 0x455A14ED);
      a = GG(a, b, c, d, x[k+13], 5, 0xA9E3E905); d = GG(d, a, b, c, x[k+2], 9, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[k+7], 14, 0x676F02D9); b = GG(b, c, d, a, x[k+12], 20, 0x8D2A4C8A);
      a = HH(a, b, c, d, x[k+5], 4, 0xFFFA3942); d = HH(d, a, b, c, x[k+8], 11, 0x8771F681);
      c = HH(c, d, a, b, x[k+11], 16, 0x6D9D6122); b = HH(b, c, d, a, x[k+14], 23, 0xFDE5380C);
      a = HH(a, b, c, d, x[k+1], 4, 0xA4BEEA44); d = HH(d, a, b, c, x[k+4], 11, 0x4BDECFA9);
      c = HH(c, d, a, b, x[k+7], 16, 0xF6BB4B60); b = HH(b, c, d, a, x[k+10], 23, 0xBEBFBC70);
      a = HH(a, b, c, d, x[k+13], 4, 0x289B7EC6); d = HH(d, a, b, c, x[k+0], 11, 0xEAA127FA);
      c = HH(c, d, a, b, x[k+3], 16, 0xD4EF3085); b = HH(b, c, d, a, x[k+6], 23, 0x04881D05);
      a = HH(a, b, c, d, x[k+9], 4, 0xD9D4D039); d = HH(d, a, b, c, x[k+12], 11, 0xE6DB99E5);
      c = HH(c, d, a, b, x[k+15], 16, 0x1FA27CF8); b = HH(b, c, d, a, x[k+2], 23, 0xC4AC5665);
      a = II(a, b, c, d, x[k+0], 6, 0xF4292244); d = II(d, a, b, c, x[k+7], 10, 0x432AFF97);
      c = II(c, d, a, b, x[k+14], 15, 0xAB9423A7); b = II(b, c, d, a, x[k+5], 21, 0xFC93A039);
      a = II(a, b, c, d, x[k+12], 6, 0x655B59C3); d = II(d, a, b, c, x[k+3], 10, 0x8F0CCC92);
      c = II(c, d, a, b, x[k+10], 15, 0xFFEFF47D); b = II(b, c, d, a, x[k+1], 21, 0x85845DD1);
      a = II(a, b, c, d, x[k+8], 6, 0x6FA87E4F); d = II(d, a, b, c, x[k+15], 10, 0xFE2CE6E0);
      c = II(c, d, a, b, x[k+6], 15, 0xA3014314); b = II(b, c, d, a, x[k+13], 21, 0x4E0811A1);
      a = II(a, b, c, d, x[k+4], 6, 0xF7537E82); d = II(d, a, b, c, x[k+11], 10, 0xBD3AF235);
      c = II(c, d, a, b, x[k+2], 15, 0x2AD7D2BB); b = II(b, c, d, a, x[k+9], 21, 0xEB86D391);
      a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }
    return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  }

  // --- Mtop API caller via GM_xmlhttpRequest ---
  function mtopRequest(api, version, data) {
    return new Promise((resolve, reject) => {
      const appKey = '12574478';
      const t = Date.now().toString();
      const dataStr = JSON.stringify(data);

      const cookieMatch = document.cookie.match(/_m_h5_tk=([^;]+)/);
      const token = cookieMatch ? cookieMatch[1].split('_')[0] : '';
      const sign = md5(`${token}&${t}&${appKey}&${dataStr}`);

      const params = new URLSearchParams({
        jsv: '2.7.0',
        appKey,
        t,
        sign,
        api,
        v: version,
        needLogin: 'true',
        LoginRequest: 'true',
        type: 'originaljson',
        dataType: 'json',
        timeout: '20000',
        ttid: '#t#ip##_h5_web_default',
        data: dataStr,
      });

      const url = `https://h5api.m.taobao.com/h5/${api}/${version}/?${params.toString()}`;

      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          headers: { Referer: 'https://market.m.taobao.com/' },
          onload: (resp) => {
            try {
              const json = JSON.parse(resp.responseText);
              if (json.ret && json.ret[0] && json.ret[0].startsWith('SUCCESS')) {
                resolve(json.data);
              } else {
                reject(new Error(json.ret ? json.ret[0] : 'unknown error'));
              }
            } catch (e) { reject(e); }
          },
          onerror: (err) => reject(err),
        });
      } else {
        reject(new Error('GM_xmlhttpRequest not available'));
      }
    });
  }

  // --- Fetch all tracking numbers for an order via mtop list API ---
  async function fetchLogisticsPackageList(orderId) {
    const listData = await mtopRequest(
      'mtop.taobao.logistics.detailorlist.query', '1.0',
      { orderId, type: 'list', entrance: 'pc' }
    );
    const dataObj = listData.data || {};
    const packages = [];
    for (const [key, val] of Object.entries(dataObj)) {
      if (key.startsWith('pakcage_') && val.fields && val.fields.rightBtnUrl) {
        const urlMatch = val.fields.rightBtnUrl.match(/logisticsOrderId=([^&]+).*mailNo=([^&]+)/);
        if (urlMatch) {
          packages.push({ logisticsOrderId: urlMatch[1], mailNo: urlMatch[2] });
        }
      }
    }
    return packages;
  }

  // --- Fetch company name for a specific package ---
  async function fetchPackageCompany(orderId, logisticsOrderId, mailNo) {
    try {
      const detailData = await mtopRequest(
        'mtop.taobao.logistics.detailorlist.query', '1.0',
        { orderId, logisticsOrderId, mailNo, entrance: 'pc' }
      );
      const detailObj = detailData.data || {};
      const companyField = detailObj.popupBodyCompony;
      return companyField && companyField.fields ? companyField.fields.name || '' : '';
    } catch (e) {
      return '';
    }
  }

  async function fetchLogistics(orderId) {
    // Step 1: get single tracking from transit_step.do (fast, no signing)
    let simpleResult = null;
    try {
      const resp = await fetch(
        `//buyertrade.taobao.com/trade/json/transit_step.do?bizOrderId=${orderId}`,
        { credentials: 'include' }
      );
      const buf = await resp.arrayBuffer();
      const text = new TextDecoder('gbk').decode(buf);
      const data = JSON.parse(text);
      if (data.isSuccess === 'true' && data.expressId) {
        simpleResult = { company: data.expressName || '', trackingNo: data.expressId || '' };
      }
    } catch (e) {
      console.warn(`[订单提取] transit_step失败 orderId=${orderId}`, e);
    }

    // Step 2: try mtop list API to discover all packages
    try {
      const packages = await fetchLogisticsPackageList(orderId);
      if (packages.length <= 1) {
        return simpleResult ? [simpleResult] : [];
      }
      // Multi-package: fetch company name for each
      const entries = await Promise.all(packages.map(async (pkg) => {
        if (simpleResult && pkg.mailNo === simpleResult.trackingNo) {
          return simpleResult;
        }
        const company = await fetchPackageCompany(orderId, pkg.logisticsOrderId, pkg.mailNo);
        return { company, trackingNo: pkg.mailNo };
      }));
      return entries;
    } catch (e) {
      console.warn(`[订单提取] mtop物流查询失败 orderId=${orderId}`, e);
      return simpleResult ? [simpleResult] : [];
    }
  }

  // --- New version parser ---
  function parseNewVersion(cutoffStr) {
    const containers = document.querySelectorAll('[id^="shopOrderContainer_"]');
    console.log(`[订单提取] 新版: 找到 ${containers.length} 个订单容器, cutoff=${cutoffStr}`);
    const orders = [];

    for (const container of containers) {
      const dateEl = container.querySelector('[class*="shopInfoOrderTime"]');
      if (!dateEl) continue;
      const dateStr = dateEl.textContent.trim();
      if (dateStr < cutoffStr) continue;

      const orderId = container.id.replace('shopOrderContainer_', '');

      const titleEls = container.querySelectorAll('a[class*="title--"] [class*="titleText"]');
      const items = [];
      for (const t of titleEls) {
        const name = t.textContent.trim();
        if (name) items.push({ name, price: '' });
      }

      const paidEl = container.querySelector('[class*="priceReal"]');
      const paid = paidEl ? paidEl.textContent.trim().replace('实付款', '') : '';

      if (items.length > 0) {
        orders.push({ orderId, date: dateStr, items, paid });
      }
    }

    return orders;
  }

  // --- Current version parser (div-based layout) ---
  function parseCurrentVersion(cutoffStr) {
    const itemLinks = document.querySelectorAll('a[href*="item.taobao.com"][href*="mi_id"]');
    console.log(`[订单提取] 当前版: 找到 ${itemLinks.length} 个商品链接, cutoff=${cutoffStr}`);

    const orderMap = {};

    for (const a of itemLinks) {
      const rawText = a.textContent;
      if (!rawText.includes('[交易快照]')) continue;
      const titleText = rawText.replace(/\[交易快照\]/g, '').trim();
      if (!titleText || titleText.length < 4) continue;

      const href = a.getAttribute('href') || '';
      const miIdMatch = href.match(/mi_id=([^&]+)/);
      const miId = miIdMatch ? miIdMatch[1] : '';

      let container = a.parentElement;
      for (let i = 0; i < 10; i++) {
        if (!container || !container.parentElement) break;
        container = container.parentElement;
        const text = container.textContent;
        if (text.includes('订单号:') && text.includes('实付款')) break;
      }
      if (!container) continue;

      const text = container.textContent;
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch || dateMatch[1] < cutoffStr) continue;

      const orderIdMatch = text.match(/订单号:\s*(\d+)/);
      if (!orderIdMatch) continue;
      const orderId = orderIdMatch[1];

      if (!orderMap[orderId]) {
        const paidMatch = text.match(/实付款￥?([\d.]+)/);
        orderMap[orderId] = {
          orderId,
          date: dateMatch[1],
          items: [],
          paid: paidMatch ? '￥' + paidMatch[1] : '',
          _seenItemIds: new Set(),
        };
      }

      const key = miId || (href + titleText);
      if (orderMap[orderId]._seenItemIds.has(key)) continue;
      orderMap[orderId]._seenItemIds.add(key);

      let price = '';
      let priceContainer = a.parentElement;
      for (let i = 0; i < 5; i++) {
        if (!priceContainer) break;
        const sibling = priceContainer.nextElementSibling;
        if (sibling) {
          const sibText = sibling.textContent;
          const m = sibText.match(/￥([\d.]+)/);
          if (m) { price = m[1]; break; }
        }
        priceContainer = priceContainer.parentElement;
      }

      orderMap[orderId].items.push({ name: titleText, price });
    }

    const results = Object.values(orderMap);
    results.forEach(o => delete o._seenItemIds);
    return results;
  }

  // --- Old version parser (table-based) ---
  function parseOldVersion(cutoffStr) {
    const orderTables = document.querySelectorAll('table[class*="bought-wrapper-mod__table"]');
    console.log(`[订单提取] 旧版: 找到 ${orderTables.length} 个订单表格, cutoff=${cutoffStr}`);
    const orders = [];

    for (const table of orderTables) {
      const headCell = table.querySelector('[class*="head-info-cell"]');
      if (!headCell) continue;

      const dateEl = headCell.querySelector('[class*="create-time"]');
      const dateStr = dateEl ? dateEl.textContent.trim() : '';
      if (!dateStr || dateStr < cutoffStr) continue;

      const reactIdEl = headCell.querySelector('[data-reactid*="order-"]');
      const reactId = reactIdEl ? reactIdEl.getAttribute('data-reactid') : '';
      const orderIdMatch = reactId.match(/order-(\d+)/);
      const orderId = orderIdMatch ? orderIdMatch[1] : '';
      if (!orderId) continue;

      const rows = table.querySelectorAll('tr');
      const items = [];
      let paid = '';

      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) continue;

        const firstCell = cells[0];
        if (firstCell.className.includes('head-info-cell')) continue;
        if (!firstCell.className.includes('sol-mod__no-br')) continue;

        const itemLinks = firstCell.querySelectorAll('a');
        for (const a of itemLinks) {
          const href = a.getAttribute('href') || '';
          const text = a.textContent.trim();
          if (href.includes('item.taobao.com') && text.length > 0) {
            let price = '';
            if (cells.length >= 2) {
              const priceText = cells[1].textContent.trim();
              const m = priceText.match(/[￥¥]([\d.]+)/);
              if (m) price = m[1];
            }
            items.push({ name: text, price });
            break;
          }
        }

        if (cells.length >= 5 && !paid) {
          const paidText = cells[4].textContent.trim();
          const match = paidText.match(/[￥¥]([\d.]+)/);
          if (match) paid = '￥' + match[1];
        }
      }

      if (items.length > 0) {
        orders.push({ orderId, date: dateStr, items, paid });
      }
    }

    return orders;
  }

  function parseOrdersFromDOM() {
    const cutoffStr = getCutoffStr();
    if (isNewVersion()) {
      return parseNewVersion(cutoffStr);
    }
    const tables = document.querySelectorAll('table[class*="bought-wrapper-mod__table"]');
    if (tables.length > 0) {
      return parseOldVersion(cutoffStr);
    }
    return parseCurrentVersion(cutoffStr);
  }

  function formatTSV(orders, logisticsMap) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - DAYS_TO_LOOK_BACK);
    const header = `淘宝订单汇总 (${formatLocalDate(startDate)} ~ ${formatLocalDate(today)})`;
    const colHeader = ['序号', '商品名称', '实付款', '快递公司', '快递单号'].join('\t');

    const rows = [];
    let seq = 0;
    for (const order of orders) {
      const entries = logisticsMap[order.orderId] || [];
      if (entries.length === 0) continue;
      const items = order.items;

      if (items.length === entries.length && items.length > 1) {
        for (let i = 0; i < items.length; i++) {
          seq++;
          const name = simplifyItemName(items[i].name);
          const price = items[i].price || order.paid.replace(/[￥¥]/g, '');
          rows.push([seq, name, price, entries[i].company, entries[i].trackingNo].join('\t'));
        }
      } else {
        for (const entry of entries) {
          seq++;
          const name = items.map(it => simplifyItemName(it.name)).join(' + ');
          const price = order.paid.replace(/[￥¥]/g, '');
          rows.push([seq, name, price, entry.company, entry.trackingNo].join('\t'));
        }
      }
    }

    return header + '\n' + colHeader + '\n' + rows.join('\n');
  }

  async function extractOrders() {
    const btn = document.getElementById('taobao-order-extractor-btn');
    if (btn) {
      btn.innerHTML = '⏳ 提取中...';
      btn.style.pointerEvents = 'none';
    }

    try {
      const orders = parseOrdersFromDOM();
      if (orders.length === 0) {
        showToast('未找到最近7天的订单');
        return;
      }

      const logisticsMap = {};
      const batchSize = 3;
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(o => fetchLogistics(o.orderId))
        );
        batch.forEach((o, idx) => { logisticsMap[o.orderId] = results[idx]; });
      }

      const tsv = formatTSV(orders, logisticsMap);

      if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(tsv, 'text');
      } else {
        await navigator.clipboard.writeText(tsv);
      }

      const lineCount = tsv.split('\n').length - 2;
      showToast(`✅ 已复制 ${lineCount} 个订单到剪贴板`, 4000);
      console.log('[订单提取] 结果:\n' + tsv);
    } catch (e) {
      console.error('[订单提取] 错误:', e);
      showToast('❌ 提取失败，请查看控制台');
    } finally {
      if (btn) {
        btn.innerHTML = '📋 提取本周订单';
        btn.style.pointerEvents = 'auto';
      }
    }
  }

  createButton();
})();
