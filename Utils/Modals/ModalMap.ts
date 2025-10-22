import { Modal } from "../App";
import * as L from "leaflet";

// Ensure Leaflet CSS is loaded once
/*const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
  const leafletCss = document.createElement("link");
  leafletCss.rel = "stylesheet";
  leafletCss.href = LEAFLET_CSS_URL;
  document.head.appendChild(leafletCss);
}*/

export class ModalMap extends Modal {
  map: L.Map | null = null;

  onOpen() {
    const { contentEl } = this;

    const mapDiv = contentEl.createDiv();
    mapDiv.id = "map";
    mapDiv.style.height = "500px";
    mapDiv.style.width = "100%";
    mapDiv.style.marginTop = "1em";

    // Initialize the map directly since Leaflet is imported as a module
    this.initializeMap();

    // Fix for Leaflet map tiles not displaying correctly in modals
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);
  }

  initializeMap() {
    if (this.map) {
      this.map.remove();
    }
    this.map = L.map("map").setView([46.603354, 1.888334], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    const markers = [
      { lat: 48.8566, lng: 2.3522, title: "Paris", description: "Capitale" },
      { lat: 45.75, lng: 4.85, title: "Lyon", description: "Gastronomie" },
      { lat: 43.2965, lng: 5.3698, title: "Marseille", description: "Port" }
    ];

    markers.forEach(({ lat, lng, title, description }) => {
      L.marker([lat, lng])
        .addTo(this.map!)
        .bindPopup(`<strong>${title}</strong><br>${description}`);
    });
  }

  onClose() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.contentEl.empty();
  }
}