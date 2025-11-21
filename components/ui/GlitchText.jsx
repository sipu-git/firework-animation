"use client";

import React from "react";
import "./GlitchText.css";

const GlitchText = ({
  children,
  speed = 1,
  enableShadows = true,
  enableOnHover = false,
  className = "",
}) => {
  const inlineStyles = {
    "--after-duration": `${speed * 3}s`,
    "--before-duration": `${speed * 2}s`,
    "--after-shadow": enableShadows ? "-5px 0 red" : "none",
    "--before-shadow": enableShadows ? "5px 0 cyan" : "none",
  };

  return (
    <div
      className={`glitch ${enableOnHover ? "enable-on-hover" : ""} ${className}`}
      style={inlineStyles}
      data-text={String(children)}
    >
      {children}
    </div>
  );
};

export default GlitchText;
