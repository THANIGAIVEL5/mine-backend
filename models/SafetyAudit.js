const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const SafetyAudit = sequelize.define('SafetyAudit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  form_type: {
    type: DataTypes.STRING, // 'DGMS Form IV', 'Statutory Strata Review', 'Ventilation Compliance'
    defaultValue: 'DGMS Form IV'
  },
  auditor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sector: {
    type: DataTypes.STRING,
    defaultValue: 'Chasnala Deep Mine Sector 4B'
  },
  compliance_rating: {
    type: DataTypes.STRING, // '100% COMPLIANT', 'NEEDS_ATTENTION', 'NON_COMPLIANT'
    defaultValue: '100% COMPLIANT'
  },
  dgms_rule_reference: {
    type: DataTypes.STRING, // 'DGMS Coal Mines Regulations 1957/2017 Reg 124/130'
    defaultValue: 'DGMS CMR 2017 Reg 124'
  },
  findings: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'safety_audits',
  timestamps: false
});

module.exports = SafetyAudit;
