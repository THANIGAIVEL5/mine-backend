const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const IncidentAlert = sequelize.define('IncidentAlert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sector: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.STRING, // 'INFO', 'WARNING', 'CRITICAL'
    allowNull: false
  },
  alert_type: {
    type: DataTypes.STRING, // 'GAS_CO_SPIKE', 'STRATA_DELAMINATION', 'SEISMIC_TREMOR', 'SUMP_WATER_INRUSH'
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  action_taken: {
    type: DataTypes.TEXT,
    defaultValue: 'Pending Safety Review'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'incident_alerts',
  timestamps: false
});

module.exports = IncidentAlert;
