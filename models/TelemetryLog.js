const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TelemetryLog = sequelize.define('TelemetryLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  site: {
    type: DataTypes.STRING,
    defaultValue: 'Chasnala Deep Mine Sector 4B'
  },
  sector: {
    type: DataTypes.STRING,
    defaultValue: 'Sector 4B'
  },
  phase: {
    type: DataTypes.STRING,
    defaultValue: 'STABLE'
  },
  pitch: {
    type: DataTypes.FLOAT,
    defaultValue: 0.5
  },
  roll: {
    type: DataTypes.FLOAT,
    defaultValue: -0.2
  },
  rms: {
    type: DataTypes.FLOAT,
    defaultValue: 0.15
  },
  co: {
    type: DataTypes.INTEGER,
    defaultValue: 12
  },
  ch4: {
    type: DataTypes.FLOAT,
    defaultValue: 0.05
  },
  disp: {
    type: DataTypes.FLOAT,
    defaultValue: 0.10
  },
  sump: {
    type: DataTypes.FLOAT,
    defaultValue: 1.30
  },
  temp: {
    type: DataTypes.FLOAT,
    defaultValue: 38.6
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'telemetry_logs',
  timestamps: false
});

module.exports = TelemetryLog;
