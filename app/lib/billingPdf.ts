import jsPDF from "jspdf"

type SchoolInfo = {
  name?: string
  email?: string
  phone?: string
}

type InvoiceData = {
  id?: number
  invoiceNumber: string
  planType: string
  amount: number
  description?: string
  status: string
  issueDate: string
  dueDate: string
  paidAt?: string | null
  school?: SchoolInfo
}

type ReceiptData = {
  id?: number
  receiptNumber: string
  amount: number
  paymentMethod?: string
  paymentDate: string
  notes?: string
  school?: SchoolInfo
  invoice?: {
    invoiceNumber: string
    planType?: string
    description?: string
    issueDate?: string
    dueDate?: string
  }
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString()
}

function formatMoney(value?: number) {
  return `₦${Number(value || 0).toLocaleString()}`
}

export function downloadInvoicePDF(invoice: InvoiceData) {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text("INVOICE", 14, 20)

  doc.setFontSize(11)
  doc.text("EduNerve School Billing", 14, 30)
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 14, 40)
  doc.text(`Status: ${invoice.status}`, 14, 48)
  doc.text(`Issue Date: ${formatDate(invoice.issueDate)}`, 14, 56)
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 14, 64)

  doc.text("Bill To:", 14, 80)
  doc.text(invoice.school?.name || "-", 14, 88)
  doc.text(invoice.school?.email || "-", 14, 96)
  doc.text(invoice.school?.phone || "-", 14, 104)

  doc.text("Invoice Details:", 14, 120)
  doc.text(`Plan: ${invoice.planType}`, 14, 130)
  doc.text(`Description: ${invoice.description || "-"}`, 14, 138)
  doc.text(`Amount: ${formatMoney(invoice.amount)}`, 14, 146)

  doc.setFontSize(13)
  doc.text(`Total Due: ${formatMoney(invoice.amount)}`, 14, 164)

  doc.setFontSize(10)
  doc.text("Thank you for choosing EduNerve.", 14, 185)
  doc.text("This is a system-generated invoice.", 14, 192)

  doc.save(`${invoice.invoiceNumber}.pdf`)
}

export function downloadReceiptPDF(receipt: ReceiptData) {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text("PAYMENT RECEIPT", 14, 20)

  doc.setFontSize(11)
  doc.text("EduNerve School Billing", 14, 30)
  doc.text(`Receipt No: ${receipt.receiptNumber}`, 14, 40)
  doc.text(`Payment Date: ${formatDate(receipt.paymentDate)}`, 14, 48)
  doc.text(`Payment Method: ${receipt.paymentMethod || "-"}`, 14, 56)

  doc.text("Received From:", 14, 72)
  doc.text(receipt.school?.name || "-", 14, 80)
  doc.text(receipt.school?.email || "-", 14, 88)
  doc.text(receipt.school?.phone || "-", 14, 96)

  doc.text("Payment Details:", 14, 112)
  doc.text(`Invoice No: ${receipt.invoice?.invoiceNumber || "-"}`, 14, 120)
  doc.text(`Plan: ${receipt.invoice?.planType || "-"}`, 14, 128)
  doc.text(`Description: ${receipt.invoice?.description || "-"}`, 14, 136)
  doc.text(`Amount Paid: ${formatMoney(receipt.amount)}`, 14, 144)

  doc.setFontSize(10)
  doc.text(`Notes: ${receipt.notes || "Payment received successfully."}`, 14, 162)
  doc.text("This is a system-generated receipt.", 14, 178)

  doc.save(`${receipt.receiptNumber}.pdf`)
}