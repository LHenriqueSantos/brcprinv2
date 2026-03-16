"use client";

import React from "react";

export default function SponsorshipLogos() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "3rem", opacity: 0.8 }}>
      <a href="https://aetherteam.pro" target="_blank" rel="noopener noreferrer" className="hover-glow-text" style={{ display: "flex", alignItems: "center", transition: "all 0.3s" }}>
        <img src="/aetherteam.png" alt="Aether Team" style={{ height: "45px", objectFit: "contain", filter: "grayscale(100%)", transition: "filter 0.3s" }} onMouseOver={e => e.currentTarget.style.filter = "none"} onMouseOut={e => e.currentTarget.style.filter = "grayscale(100%)"} />
      </a>
      
      <a href="https://leosantos.run" target="_blank" rel="noopener noreferrer" className="hover-glow-text" style={{ display: "flex", alignItems: "center", transition: "all 0.3s" }}>
        <img src="/leosantos.png" alt="Leo Santos Racing" style={{ height: "45px", objectFit: "contain", filter: "grayscale(100%)", transition: "filter 0.3s" }} onMouseOver={e => e.currentTarget.style.filter = "none"} onMouseOut={e => e.currentTarget.style.filter = "grayscale(100%)"} />
      </a>

      <a href="https://ligaflowracing.com.br" target="_blank" rel="noopener noreferrer" className="hover-glow-text" style={{ display: "flex", alignItems: "center", transition: "all 0.3s" }}>
        <img src="/ligaflowracing.svg" alt="Liga Flow Racing" style={{ height: "45px", objectFit: "contain", filter: "grayscale(100%) brightness(2)", transition: "all 0.3s" }} onMouseOver={e => { e.currentTarget.style.filter = "none"; }} onMouseOut={e => { e.currentTarget.style.filter = "grayscale(100%) brightness(2)"; }} />
      </a>
    </div>
  );
}
