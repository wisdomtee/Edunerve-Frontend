export const downloadStudentId = async (
  elementId: string,
  fileName: string
) => {
  try {
    const html2canvas = (
      await import("html2canvas")
    ).default

    const element =
      document.getElementById(elementId)

    if (!element) return

    const canvas = await html2canvas(element)

    const image = canvas.toDataURL("image/png")

    const link = document.createElement("a")

    link.href = image
    link.download = `${fileName}.png`

    link.click()
  } catch (err) {
    console.error(err)
  }
}