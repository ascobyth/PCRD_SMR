// Export all models from this file
const { User, Role } = require('./User');
const Capability = require('./Capability');
const TestingMethod = require('./TestingMethod');
const Equipment = require('./Equipment');
const Location = require('./Location');
const Io = require('./Io');
const Request = require('./Request');
const TestingSample = require('./TestingSample');
const SampleCommercial = require('./SampleCommercial');
const AppTech = require('./AppTech');
const PlantReactor = require('./PlantReactor');

module.exports = {
  User,
  Role,
  Capability,
  TestingMethod,
  Equipment,
  Location,
  Io,
  Request,
  TestingSample,
  SampleCommercial,
  AppTech,
  PlantReactor
};
