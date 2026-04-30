// ==UserScript==
// @name         淘宝订单提取器
// @namespace    https://github.com/sfdye/taobao-order-extractor
// @version      1.1
// @description  提取最近一周淘宝订单信息，格式化为TSV方便粘贴到腾讯文档
// @author       sfdye
// @match        *://buyertrade.taobao.com/trade/itemlist/*
// @grant        GM_setClipboard
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

  async function fetchLogistics(orderId) {
    try {
      const resp = await fetch(
        `//buyertrade.taobao.com/trade/json/transit_step.do?bizOrderId=${orderId}`,
        { credentials: 'include' }
      );
      const buf = await resp.arrayBuffer();
      const text = new TextDecoder('gbk').decode(buf);
      const data = JSON.parse(text);
      if (data.isSuccess === 'true') {
        return { company: data.expressName || '', trackingNo: data.expressId || '' };
      }
    } catch (e) {
      console.warn(`[订单提取] 物流查询失败 orderId=${orderId}`, e);
    }
    return { company: '', trackingNo: '' };
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
        if (name) items.push(name);
      }

      const paidEl = container.querySelector('[class*="priceReal"]');
      const paid = paidEl ? paidEl.textContent.trim().replace('实付款', '') : '';

      if (items.length > 0) {
        orders.push({ orderId, date: dateStr, items, paid });
      }
    }

    return orders;
  }

  // --- Old version parser ---
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
            items.push(text);
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
    return parseOldVersion(cutoffStr);
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
      const log = logisticsMap[order.orderId] || { company: '', trackingNo: '' };
      if (!log.trackingNo) continue;
      seq++;
      const itemName = order.items.map(simplifyItemName).join(' + ');
      const paid = order.paid.replace(/[￥¥]/g, '');
      rows.push([seq, itemName, paid, log.company, log.trackingNo].join('\t'));
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
      const batchSize = 5;
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
