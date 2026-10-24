export function scrollToTop(targetId: string = "main-container") {
  if (typeof window === "undefined") return;

  // Resetea scroll global de la ventana
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });

  // Resetea el contenedor si tiene scroll propio
  const container = document.getElementById(targetId);
  if (container) {
    container.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
}
