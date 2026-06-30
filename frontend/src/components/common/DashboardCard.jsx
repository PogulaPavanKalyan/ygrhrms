import React from 'react';

const DashboardCard = ({ title, value, iconClass, iconColor = 'var(--accent-blue)', style = {} }) => {
  return (
    <div className="dashboard-metric-card" style={style}>
      <div className="metric-info">
        <span className="metric-title">{title}</span>
        <span className="metric-value">{value}</span>
      </div>
      <div className="metric-icon-wrap" style={{ background: `${iconColor}15`, color: iconColor }}>
        <i className={iconClass}></i>
      </div>
    </div>
  );
};

export default DashboardCard;
/n
