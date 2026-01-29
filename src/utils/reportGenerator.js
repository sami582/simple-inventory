// src/utils/reportGenerator.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generateInventoryReport({ items = [], labels = {}, locale = 'en' } = {}) {
  try {
    // Build safe label set (prefer explicit labels, then tableHeaders, then sensible english fallback)
    const TH = labels.tableHeaders || []
    const table_item = labels.table_item || TH[0] || 'Item Name'
    const table_category = labels.table_category || TH[1] || 'Category'
    const table_quantity = labels.table_quantity || TH[2] || 'Quantity'
    const table_unit = labels.table_unit || TH[3] || 'Unit'
    const table_min_stock = labels.table_min_stock || TH[4] || 'Min Stock'
    const table_description = labels.table_description || TH[5] || 'Description'

    const L = {
      title: labels.title || labels.inventory_report_title || 'Inventory Report',
      generatedOn: labels.generatedOn || labels.generated_on || 'Generated on',
      summaryTitle: labels.summaryTitle || labels.summary || 'Summary',
      lowStockHeader: labels.lowStockHeader || labels.low_stock_alerts || 'Low Stock Alerts',
      allGood: labels.allGood || labels.all_good || 'All items are above minimum stock levels ✅',
      totalProductsLabel: labels.totalProductsLabel || labels.total_products_label || 'Total products',
      totalQuantityLabel: labels.totalQuantityLabel || labels.total_quantity_label || 'Total quantity in stock',
      tableHeaders: [table_item, table_category, table_quantity, table_unit, table_min_stock, table_description],
      lowStockColumns: labels.lowStockColumns || [table_item, table_quantity, table_min_stock]
    }

    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    const nf = new Intl.NumberFormat(locale)

    const now = new Date()
    const doc = new jsPDF({ orientation: 'landscape' })

    // HEADER
    doc.setFontSize(18)
    doc.text(L.title, 14, 20)

    doc.setFontSize(11)
    doc.setTextColor(100)
    const genText = `${L.generatedOn}: ${dtf.format(now)}`
    doc.text(genText, 14, 28)
    doc.line(14, 30, doc.internal.pageSize.width - 14, 30)

    // SUMMARY
    const totalProducts = items.length
    const totalQuantity = items.reduce((s, it) => s + Number(it.quantity || 0), 0)

    doc.setFontSize(13)
    doc.setTextColor(0)
    doc.text(L.summaryTitle, 14, 42)

    doc.setFontSize(11)
    const totalProductsLine = `• ${L.totalProductsLabel}: ${nf.format(totalProducts)}`
    const totalQuantityLine = `• ${L.totalQuantityLabel}: ${nf.format(totalQuantity)}`
    doc.text(totalProductsLine, 14, 50)
    doc.text(totalQuantityLine, 14, 56)

    // TABLE
    const tableBody = items.map(item => [
      item.name || '-',
      item.category || '-',
      nf.format(item.quantity || 0),
      item.unit || '',
      item.minStock != null ? nf.format(item.minStock) : '-',
      item.description || '-'
    ])

    autoTable(doc, {
      startY: 70,
      head: [L.tableHeaders],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      bodyStyles: { fontSize: 10 },
      styles: { cellPadding: 3 },
      margin: { left: 10, right: 10 }
    })

    // LOW STOCK SECTION
    const lowStockItems = items.filter(it => it.minStock != null && Number(it.quantity) <= Number(it.minStock))
    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 72

    doc.setFontSize(13)
    doc.text(L.lowStockHeader, 14, finalY)

    if (!lowStockItems.length) {
      doc.setFontSize(11)
      doc.text(L.allGood, 14, finalY + 8)
    } else {
      const lowTable = lowStockItems.map(it => [
        it.name || '-',
        nf.format(it.quantity || 0),
        nf.format(it.minStock || 0)
      ])

      autoTable(doc, {
        startY: finalY + 10,
        head: [L.lowStockColumns],
        body: lowTable,
        theme: 'grid',
        headStyles: { fillColor: [200, 50, 50], textColor: 255 },
        bodyStyles: { fontSize: 10 },
        styles: {}
      })
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(9)
      const footerText = `Page ${i} of ${pageCount}`
      doc.text(footerText, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 8, { align: 'right' })
    }

    const filename = `inventory-${now.toISOString().slice(0,10)}.pdf`
    doc.save(filename)

    return { ok: true, filename }
  } catch (err) {
    console.error('[reportGenerator] Error generating PDF:', err)
    if (typeof window !== 'undefined') {
      alert('Failed to generate report. See console for details.')
    }
    return { ok: false, error: err?.message || String(err) }
  }
}

export default generateInventoryReport
