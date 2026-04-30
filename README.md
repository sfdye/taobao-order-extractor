# 淘宝订单提取器 (Taobao Order Extractor)

A Tampermonkey/Greasemonkey userscript that extracts recent Taobao order information and formats it as TSV for easy pasting into spreadsheets.

## Features

- Extracts orders from the past 7 days
- Retrieves logistics/tracking information for each order
- Formats output as TSV (tab-separated values) for pasting into Google Sheets, Tencent Docs, etc.
- Supports both old and new Taobao order page layouts
- One-click copy to clipboard

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox)

2. Click the link below to install the script:
   - [Install taobao-order-extractor.user.js](../../raw/master/taobao-order-extractor.user.js)

3. Navigate to your [Taobao order list](https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm) and click the floating "📋 提取本周订单" button.

## Output Format

The extracted data is copied as TSV with these columns:

| # | 商品 | 实付 | 快递公司 | 快递单号 |
|---|------|------|----------|----------|
| 1 | Item name | 99.00 | SF Express | SF1234567890 |

---

## 简体中文

一个 Tampermonkey/Greasemonkey 油猴脚本，用于提取最近一周的淘宝订单信息，并格式化为 TSV 方便粘贴到表格软件。

### 功能

- 提取最近 7 天的订单
- 自动获取每笔订单的物流信息
- 输出为 TSV 格式（制表符分隔），可直接粘贴到腾讯文档、Google Sheets 等
- 同时支持新旧版淘宝订单页面
- 一键复制到剪贴板

### 安装

1. 安装油猴插件：
   - [Tampermonkey](https://www.tampermonkey.net/)（Chrome、Firefox、Edge、Safari）
   - [Violentmonkey](https://violentmonkey.github.io/)（Chrome、Firefox）

2. 点击以下链接安装脚本：
   - [安装 taobao-order-extractor.user.js](../../raw/master/taobao-order-extractor.user.js)

3. 打开[淘宝已买到的宝贝](https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm)页面，点击右下角悬浮的「📋 提取本周订单」按钮即可。

### 输出格式

提取的数据以 TSV 格式复制到剪贴板，包含以下列：

| # | 商品 | 实付 | 快递公司 | 快递单号 |
|---|------|------|----------|----------|
| 1 | 商品名称 | 99.00 | 顺丰速运 | SF1234567890 |

## License

[MIT](LICENSE)
