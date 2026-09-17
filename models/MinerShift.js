const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const MinerShift = sequelize.define('MinerShift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  miner_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING, // 'Face Miner', 'Shift In-Charge', 'Ventilation Tech', 'Electrical Engineer', 'Geotechnical Analyst'
    allowNull: false
  },
  sector: {
    type: DataTypes.STRING,
    defaultValue: 'Sector 4B'
  },
  zone: {
    type: DataTypes.STRING, // 'Shaft 12', 'Drift 12', 'Pillar 4B Gallery', 'Refuge Bay 3B'
    allowNull: false
  },
  scsr_status: {
    type: DataTypes.STRING, // 'OPERATIONAL', 'DEPLOYED', 'LOW_OXYGEN'
    defaultValue: 'OPERATIONAL'
  },
  status: {
    type: DataTypes.STRING, // 'ACTIVE_UNDERGROUND', 'SURFACE_STANDBY', 'EVACUATED'
    defaultValue: 'ACTIVE_UNDERGROUND'
  },
  shift_start: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'miner_shifts',
  timestamps: false
});

module.exports = MinerShift;
