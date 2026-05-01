[English](README.md) | [简体中文](README.zh-CN.md)

# 淘宝订单提取器

[![Greasy Fork](https://img.shields.io/greasyfork/v/576039)](https://greasyfork.org/en/scripts/576039-%E6%B7%98%E5%AE%9D%E8%AE%A2%E5%8D%95%E6%8F%90%E5%8F%96%E5%99%A8)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

一个 Tampermonkey/Greasemonkey 油猴脚本，用于提取最近一周的淘宝订单信息，并格式化为 TSV 方便粘贴到表格软件。

## 功能

- 可选时间范围（1 周 / 2 周 / 1 月），选择自动记忆
- 自动获取每笔订单的物流信息，支持多包裹订单
- 提取每个商品的单独价格
- 输出为 TSV 格式（制表符分隔），可直接粘贴到腾讯文档、Google Sheets、Excel 等
- 同时支持多种淘宝订单页面布局（新版、旧版、当前版）
- 自动跳过官方直邮订单和赠品
- 一键复制到剪贴板

## 安装

### 从 Greasy Fork 安装（推荐）

直接从 [Greasy Fork](https://greasyfork.org/en/scripts/576039-%E6%B7%98%E5%AE%9D%E8%AE%A2%E5%8D%95%E6%8F%90%E5%8F%96%E5%99%A8) 安装，支持自动更新。

### 手动安装

1. 安装油猴插件：
   - [Tampermonkey](https://www.tampermonkey.net/)（Chrome、Firefox、Edge、Safari）
   - [Violentmonkey](https://violentmonkey.github.io/)（Chrome、Firefox）

2. 点击以下链接安装脚本：
   - [安装 taobao-order-extractor.user.js](../../raw/master/taobao-order-extractor.user.js)

## 使用方法

1. 打开[淘宝已买到的宝贝](https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm)页面
2. （可选）点击按钮左侧的 ▼ 选择时间范围（1 周、2 周或 1 月）
3. 点击「📋 提取本周订单」按钮开始提取
4. 提取的 TSV 数据会自动复制到剪贴板，直接粘贴到表格即可

## 输出格式

提取的数据以 TSV 格式复制到剪贴板，包含以下列：

| 序号 | 商品名称 | 实付款 | 快递公司 | 快递单号 |
|------|----------|--------|----------|----------|
| 1 | 商品 A | 52.00 | 中通快递 | 7899000001 |
| 2 | 商品 B | 35.00 | 顺丰速运 | SF0000000001 |
| 3 | 商品 C + 商品 D | 88.00 | 圆通速递 | YT0000000001 |

- 多包裹订单：每个商品单独一行，各自对应快递信息（第 1-2 行）
- 多商品单包裹订单：合并为一行，商品名用「+」连接（第 3 行）

## 许可证

[MIT](LICENSE)
