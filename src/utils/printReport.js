// src/utils/printReport.js
function escapeHtml(s) {
  if (s === null || s === undefined) return ''
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function generatePrintableReport({ items = [], labels = {}, locale = 'en' } = {}) {
  // Build safe label set (prefer explicit labels, then tableHeaders, then sensible english fallback)
  const TH = labels.tableHeaders || []
  const table_item = labels.table_item || TH[0] || 'Item'
  const table_category = labels.table_category || TH[1] || 'Category'
  const table_quantity = labels.table_quantity || TH[2] || 'Quantity'
  const table_unit = labels.table_unit || TH[3] || 'Unit'
  const table_min_stock = labels.table_min_stock || TH[4] || 'Min'
  const table_description = labels.table_description || TH[5] || 'Description'

  const L = {
    title: labels.title || labels.inventory_report_title || 'Inventory Report',
    generatedOn: labels.generatedOn || labels.generated_on || 'Generated on',
    summary: labels.summary || 'Summary',
    lowStockHeader: labels.lowStockHeader || labels.low_stock_alerts || 'Low Stock Alerts',
    allGood: labels.allGood || labels.all_good || 'All items are above minimum stock levels ✅',
    totalProductsLabel: labels.totalProductsLabel || labels.total_products_label || 'Total products',
    totalQuantityLabel: labels.totalQuantityLabel || labels.total_quantity_label || 'Total quantity in stock',
    tableHeaders: [table_item, table_category, table_quantity, table_unit, table_min_stock, table_description],
    // derive lowStockColumns from available translations (item, quantity, min)
    lowStockColumns: labels.lowStockColumns || [
      labels.lowStockColumns?.[0] || table_item,
      labels.lowStockColumns?.[1] || table_quantity,
      labels.lowStockColumns?.[2] || table_min_stock
    ],
    printableNote: labels.printableNote || labels.printable_note || ''
  }

  const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
  const nf = new Intl.NumberFormat(locale)

  const now = new Date()
  const dir = 'ltr'
  const lang = locale || 'en'

  const rowsHtml = items.map(it => {
    const name = escapeHtml(it.name || '-')
    const category = escapeHtml(it.category || '-')
    const quantity = nf.format(Number(it.quantity ?? 0))
    const unit = escapeHtml(it.unit || '')
    const minStock = it.minStock != null ? nf.format(it.minStock) : '-'
    const desc = escapeHtml(it.description || '')
    return `<tr>
      <td class="cell-name">${name}</td>
      <td class="cell-cat">${category}</td>
      <td class="cell-qty" style="text-align:right">${quantity}</td>
      <td class="cell-unit">${unit}</td>
      <td class="cell-min" style="text-align:right">${minStock}</td>
      <td class="cell-desc">${desc}</td>
    </tr>`
  }).join('\n')

  const lowStockItems = items.filter(it => it.minStock != null && Number(it.quantity) <= Number(it.minStock))
  const lowStockRows = lowStockItems.map(it => {
    const name = escapeHtml(it.name || '-')
    const q = nf.format(Number(it.quantity ?? 0))
    const min = nf.format(it.minStock ?? 0)
    return `<tr><td>${name}</td><td style="text-align:right">${q}</td><td style="text-align:right">${min}</td></tr>`
  }).join('\n')

  const html = `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(L.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
<style>
  :root { --pad: 12px; --muted: #666; --accent: #2563eb; }
  body {
    font-family: 'Inter', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 18px;
    color:#111;
    background:#fff;
    -webkit-font-smoothing:antialiased;
    -moz-osx-font-smoothing:grayscale;
    word-break: break-word;
  }
  header { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:10px; flex-wrap:wrap; }
  h1 { margin:0; font-size:20px; }
  .meta { color:var(--muted); font-size:12px; }
  hr { border:none; border-top:1px solid #e5e7eb; margin:12px 0; }
  .summary { margin: 8px 0 16px; }
  .summary b { display:block; margin-bottom:6px; }
  table { border-collapse: collapse; width:100%; margin-top:8px; font-size:12px; table-layout: auto; }
  th, td { border:1px solid #e6e6e6; padding:8px; vertical-align:top; }
  th { background:#f3f4f6; text-align:left; font-weight:600; }
  td.cell-qty, td.cell-min { text-align:right; }
  .lowstock { margin-top:20px; }
  .footer { margin-top:20px; font-size:11px; color:var(--muted); text-align:right; }
  .no-print { display:inline-block; }
  @media print { body { margin:8px; } .no-print { display:none; } }
  @media (max-width:600px) { header { flex-direction:column; align-items:flex-start; } .meta { margin-top:6px; } }
</style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(L.title)}</h1>
      <div class="meta">${escapeHtml(L.generatedOn)}: ${escapeHtml(dtf.format(now))}</div>
    </div>
    <div class="no-print">
      <button onclick="window.print()" style="padding:8px 12px;font-size:13px;margin-left:12px">${escapeHtml('Print')}</button>
    </div>
  </header>

  <hr>

  <section class="summary">
    <b>${escapeHtml(L.summary)}</b>
    <div>${escapeHtml(L.totalProductsLabel)}: ${nf.format(items.length)}</div>
    <div>${escapeHtml(L.totalQuantityLabel)}: ${nf.format(items.reduce((s,i)=>s+Number(i.quantity||0),0))}</div>
  </section>

  <section>
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(L.tableHeaders[0])}</th>
          <th>${escapeHtml(L.tableHeaders[1])}</th>
          <th>${escapeHtml(L.tableHeaders[2])}</th>
          <th>${escapeHtml(L.tableHeaders[3])}</th>
          <th>${escapeHtml(L.tableHeaders[4])}</th>
          <th>${escapeHtml(L.tableHeaders[5])}</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || `<tr><td colspan="6" style="text-align:center">${escapeHtml('No items')}</td></tr>`}
      </tbody>
    </table>
  </section>

  <section class="lowstock">
    <h3>${escapeHtml(L.lowStockHeader)}</h3>
    ${ lowStockItems.length === 0
      ? `<div>${escapeHtml(L.allGood)}</div>`
      : `<table>
           <thead><tr>
             <th>${escapeHtml(L.lowStockColumns[0])}</th>
             <th style="text-align:right">${escapeHtml(L.lowStockColumns[1])}</th>
             <th style="text-align:right">${escapeHtml(L.lowStockColumns[2])}</th>
           </tr></thead>
           <tbody>${lowStockRows}</tbody>
         </table>` }
  </section>

  <div class="footer">${escapeHtml(L.printableNote)}</div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        try {
          window.print();
        } catch (e) {
          console.warn('Print failed', e);
        }
      }, 350);
    }
  </script>
</body>
</html>`

  try {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    try {
      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()

      setTimeout(() => {
        try { URL.revokeObjectURL(url) } catch (e) { /* ignore */ }
      }, 10000)

      return { ok: true, printed: true, method: 'anchor-new-tab' }
    } catch (anchorErr) {
      window.location.href = url
      return { ok: true, printed: false, method: 'same-tab-fallback' }
    }
  } catch (err) {
    console.error('[printReport] failed to open printable page:', err)
    return { ok: false, error: String(err) }
  }
}

export default generatePrintableReport
