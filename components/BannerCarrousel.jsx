import React, { useEffect, useMemo, useState } from "react";
import { Carousel, Spin, Typography, Button } from "antd";

const { Text } = Typography;

const API_BASE = "http://localhost:3000/api"; // 🔹 cuando tengas el endpoint real lo cambiamos
const API_HOST = API_BASE.replace(/\/api$/, "");

// Normaliza rutas a URL válidas
function getAssetUrl(p) {
  if (!p) return "";
  let s = String(p).replace(/\\/g, "/").trim();
  try {
    new URL(s);
    return s;
  } catch {}
  if (s.startsWith("assets/")) return `${API_HOST}/${s}`;
  return `${API_HOST}/assets/${s.replace(/^\/+/, "")}`;
}

async function fetchBanners() {
  try {
    const res = await fetch(`${API_BASE}/banners?only_active=true`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default function BannerCarousel({
  fullWidth = false,
  fade = true,
  fadeStop = 0.78,
  overlayFallback = false,
  fadeTo = "#000",
  style,
}) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await fetchBanners();
        setBanners(Array.isArray(list) ? list : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ordered = useMemo(() => {
    return [...banners].sort((a, b) => {
      const ao = a?.sort_order ?? 0;
      const bo = b?.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      const ac = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bc = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return bc - ac;
    });
  }, [banners]);

  // ancho total
  const breakoutStyle = fullWidth
    ? {
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }
    : {};

  const mask = `linear-gradient(to bottom, #000 0%, #000 ${Math.round(
    fadeStop * 100
  )}%, transparent 100%)`;

  return (
    <div style={{ ...breakoutStyle, ...style }}>
      <div style={{ overflow: "hidden" }}>
        {loading ? (
          <Spin style={{ display: "block", margin: "24px auto" }} />
        ) : ordered.length ? (
          <Carousel autoplay autoplaySpeed={3500} dots>
            {ordered.map((b, i) => {
              const src = getAssetUrl(b.image_url);

              const imgStyle = {
                width: "100%",
                height: "100%", // se adapta al contenedor
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
                WebkitMaskImage: fade ? mask : undefined,
                maskImage: fade ? mask : undefined,
              };

              return (
                <div key={b.id || i}>
                  <div
                    style={{
                      width: "100%",
                      height: "250px", // 🔹 altura fija en desktop
                      background: "transparent",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    className="banner-container"
                  >
                    {b.link_url ? (
                      <a
                        href={b.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={src}
                          alt={b.title || `banner-${b.id || i}`}
                          style={imgStyle}
                        />
                      </a>
                    ) : (
                      <img
                        src={src}
                        alt={b.title || `banner-${b.id || i}`}
                        style={imgStyle}
                      />
                    )}

                    {/* Overlay con botón */}
                    <div
                      className="overlay"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity 0.3s ease-in-out",
                      }}
                    >
                      <Button type="primary" size="large">
                        Comprar Tickets
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </Carousel>
        ) : (
          <div
            style={{
              width: "100%",
              height: "450px",
              background: "#0b0b0b",
              color: "#cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "inherit" }}>Agregá banners desde el panel</Text>
          </div>
        )}
      </div>

      {/* estilos globales */}
      <style>
        {`
          .ant-carousel .slick-slide div:hover .overlay {
            opacity: 1;
          }

          /* Responsive: en mobile menos altura */
          @media (max-width: 768px) {
            .banner-container {
              height: 180px !important;
            }
          }
        `}
      </style>
    </div>
  );
}
