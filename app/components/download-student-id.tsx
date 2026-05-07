"use client"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export async function downloadStudentId() {
  const card = document.getElementById("student-id-card")

  if (!card) return

  const canvas = await html2canvas(card)

  const imgData = canvas.toDataURL("image/png")

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [340, 210],
  })

  pdf.addImage(imgData, "PNG", 0, 0, 340, 210)

  pdf.save("student-id-card.pdf")
}