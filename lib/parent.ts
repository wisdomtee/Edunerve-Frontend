export type ParentChild = {
  id: number
  name: string
  className?: string
}

const STORAGE_KEY = "selected_child"

export function setSelectedChild(child: ParentChild) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(child))
}

export function getSelectedChild(): ParentChild | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearSelectedChild() {
  localStorage.removeItem(STORAGE_KEY)
}