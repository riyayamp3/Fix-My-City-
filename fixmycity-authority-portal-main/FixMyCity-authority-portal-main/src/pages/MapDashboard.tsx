import { DashboardLayout } from "@/components/DashboardLayout";
import { useComplaints } from "@/hooks/useComplaints";
import { MapPin, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const severityColors: Record<string, string> = {
  HIGH: "#EF4444",
  MEDIUM: "#F59E0B",
  LOW: "#10B981",
};

const statusColors: Record<string, string> = {
  RECEIVED: "#3B82F6",
  JOB_CREATED: "#3B82F6",
  IN_PROGRESS: "#F59E0B",
  COMPLETED: "#10B981",
};

export default function MapDashboard() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { complaints, loading } = useComplaints();

  useEffect(() => {
    if (!mapRef.current || loading) return;

    import("leaflet").then((L) => {
      // Import CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const map = L.map(mapRef.current!, {
        zoomControl: false,
      }).setView([40.7128, -74.005], 14);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      complaints.forEach((c) => {
        const color = c.status === "COMPLETED" ? "#10B981" : (severityColors[c.severity] ?? "#3B82F6");
        const icon = L.divIcon({
          className: "custom-pin",
          html: `<div style="
            width: 28px; height: 28px;
            background: ${color}22;
            border: 2px solid ${color};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 12px ${color}44;
            cursor: pointer;
          "><div style="width: 8px; height: 8px; background: ${color}; border-radius: 50%;"></div></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([c.location.lat, c.location.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: Inter, sans-serif; min-width: 180px;">
              <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${c.description}</div>
              <div style="font-size: 11px; color: #888; margin-bottom: 6px;">${c.location.address}</div>
              <div style="display: flex; gap: 6px;">
                <span style="font-size: 10px; padding: 2px 8px; border-radius: 999px; background: ${severityColors[c.severity] ?? "#3B82F6"}22; color: ${severityColors[c.severity] ?? "#3B82F6"}; font-weight: 600;">${c.severity}</span>
                <span style="font-size: 10px; padding: 2px 8px; border-radius: 999px; background: ${statusColors[c.status] ?? "#3B82F6"}22; color: ${statusColors[c.status] ?? "#3B82F6"}; font-weight: 600;">${c.status}</span>
              </div>
            </div>
          `, { className: "dark-popup" });
      });

      setMapLoaded(true);

      return () => {
        map.remove();
      };
    });
  }, [complaints]);

  const criticalCount = complaints.filter(c => c.severity === "HIGH" && c.status !== "COMPLETED").length;
  const mediumCount = complaints.filter(c => c.severity === "MEDIUM" && c.status !== "COMPLETED").length;
  const resolvedCount = complaints.filter(c => c.status === "COMPLETED").length;

  return (
    <DashboardLayout title="Map Dashboard">
      <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">
        {/* Legend overlay */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap gap-3"
        >
          <div className="glass-card px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: "#EF4444" }} />
            <span className="text-sm text-foreground font-medium">{criticalCount} Critical</span>
          </div>
          <div className="glass-card px-4 py-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: "#F59E0B" }} />
            <span className="text-sm text-foreground font-medium">{mediumCount} Medium</span>
          </div>
          <div className="glass-card px-4 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: "#10B981" }} />
            <span className="text-sm text-foreground font-medium">{resolvedCount} Resolved</span>
          </div>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 glass-card overflow-hidden rounded-2xl relative"
        >
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              <MapPin className="w-5 h-5 mr-2 animate-pulse" />
              Loading map data...
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full" />
          )}
          <style>{`
            .dark-popup .leaflet-popup-content-wrapper {
              background: #1a1a1a;
              color: #fff;
              border: 1px solid #333;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            }
            .dark-popup .leaflet-popup-tip {
              background: #1a1a1a;
              border: 1px solid #333;
            }
            .leaflet-control-zoom a {
              background: #1a1a1a !important;
              color: #fff !important;
              border-color: #333 !important;
            }
            .leaflet-control-zoom a:hover {
              background: #2a2a2a !important;
            }
          `}</style>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
