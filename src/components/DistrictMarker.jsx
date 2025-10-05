import React, { useState } from 'react';

const DistrictMarker = ({ district, index, onHover, onLeave, onClick, isCluster, clusterCount }) => {
  const [isHovered, setIsHovered] = useState(false);
  const x = (district.position.x / 100) * 509;
  const y = (district.position.y / 100) * 716.1;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('District marker clicked:', district.name);
    onClick(district);
  };

  const handleMouseEnter = (e) => {
    e.stopPropagation();
    setIsHovered(true);
    onHover({ ...district, x, y });
  };

  const handleMouseLeave = (e) => {
    e.stopPropagation();
    setIsHovered(false);
    onLeave();
  };

  // Cluster marker (multiple districts in same area)
  if (isCluster) {
    return (
      <g
        key={`district-cluster-${index}`}
        style={{ pointerEvents: 'all', cursor: 'pointer' }}
      >
        {/* Invisible larger circle for easier clicking */}
        <circle
          cx={x}
          cy={y}
          r="18"
          fill="transparent"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
        {/* Glow effect on hover */}
        {isHovered && (
          <circle
            cx={x}
            cy={y}
            r="14"
            fill="#F59E0B"
            opacity="0.3"
            className="pointer-events-none animate-pulse"
            style={{ pointerEvents: 'none' }}
          />
        )}
        {/* Outer circle */}
        <circle
          cx={x}
          cy={y}
          r={isHovered ? "10" : "9"}
          fill="#F59E0B"
          stroke="white"
          strokeWidth={isHovered ? "2.5" : "2"}
          className="transition-all duration-200 pointer-events-none"
          style={{ pointerEvents: 'none' }}
        />
        {/* Count text */}
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none select-none"
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            fill: 'white',
            pointerEvents: 'none'
          }}
        >
          {clusterCount}
        </text>
      </g>
    );
  }

  // Single district marker
  return (
    <g
      key={`district-${index}`}
      style={{ pointerEvents: 'all', cursor: 'pointer' }}
    >
      {/* Invisible larger circle for easier clicking */}
      <circle
        cx={x}
        cy={y}
        r="12"
        fill="transparent"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      {/* Glow effect on hover */}
      {isHovered && (
        <circle
          cx={x}
          cy={y}
          r="8"
          fill="#F59E0B"
          opacity="0.3"
          className="pointer-events-none animate-pulse"
          style={{ pointerEvents: 'none' }}
        />
      )}
      {/* Visible outer circle */}
      <circle
        cx={x}
        cy={y}
        r={isHovered ? "6" : "5"}
        fill="#F59E0B"
        stroke="white"
        strokeWidth={isHovered ? "2.5" : "2"}
        className="transition-all duration-200 pointer-events-none"
        style={{ pointerEvents: 'none' }}
      />
      {/* Visible inner circle */}
      <circle
        cx={x}
        cy={y}
        r={isHovered ? "4" : "3"}
        fill="#FBBF24"
        className="transition-all duration-200 pointer-events-none"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
};

export default DistrictMarker;
