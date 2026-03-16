"use client";

import { useState } from "react";
import ModelViewer from "./ModelViewer";

export default function Hero3DScene() {
  const [hovered, setHover] = useState(false);

  return (
    <div
      style={{ width: "100%", height: "450px", position: "relative" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Decorative background glow behind the 3D object */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "350px",
        height: "350px",
        background: hovered ? "radial-gradient(circle, rgba(108, 99, 255, 0.5) 0%, rgba(0,0,0,0) 70%)" : "radial-gradient(circle, rgba(108, 99, 255, 0.3) 0%, rgba(0,0,0,0) 60%)",
        filter: "blur(50px)",
        zIndex: 0,
        pointerEvents: "none",
        transition: "background 0.4s ease"
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: hovered ? "0 0 30px rgba(108, 99, 255, 0.3)" : "none", transition: "all 0.3s ease", background: "rgba(0,0,0,0.5)" }}>
        <ModelViewer
          url="/home.3mf"
          filename="home.3mf"
          color="#6c63ff"
          materialType="PLA"
          forceMulticolor={false}
        />
      </div>
    </div>
  );
}
