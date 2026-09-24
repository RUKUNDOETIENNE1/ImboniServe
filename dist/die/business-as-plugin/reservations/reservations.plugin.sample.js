"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationsPluginSample = void 0;
const plugin_template_1 = require("../../../die/business-as-plugin/conversion/plugin-template");
const reservations_adapter_1 = require("./reservations.adapter");
// Reference-only sample plugin object (NOT registered)
exports.ReservationsPluginSample = (0, plugin_template_1.buildDomainPlugin)(new reservations_adapter_1.ReservationsPluginAdapter());
