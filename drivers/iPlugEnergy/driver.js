'use strict';
const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');
let temperature_offset = 0;

module.exports = new ZwaveDriver(path.basename(__dirname), {
	debug: true,
	capabilities: {
		onoff: {
			'command_class': 'COMMAND_CLASS_SWITCH_BINARY',
			'command_get': 'SWITCH_BINARY_GET',
			'command_set': 'SWITCH_BINARY_SET',
			'command_set_parser': value => {
				return {
					'Switch Value': (value) ? 'on/enable' : 'off/disable'
				};
			},
			'command_report': 'SWITCH_BINARY_REPORT',
			'command_report_parser': report => {
				return report['Value'] === 'on/enable';
			}
		},
		measure_power: {
			'command_class': 'COMMAND_CLASS_METER',
			'command_get': 'METER_GET',
			'command_get_parser': () => {
				return {
					'Properties1': {
						'Scale': 5
					}
				};
			},
			'command_report': 'METER_REPORT',
			'command_report_parser': report => {
				if (report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale') &&
					report.Properties2.Scale === 2)
					return report['Meter Value (Parsed)'];

				return null;
			}
		},
		meter_power: {
			'command_class': 'COMMAND_CLASS_METER',
			'command_get': 'METER_GET',
			'command_get_parser': () => {
				return {
					'Properties1': {
						'Scale': 0
					}
				};
			},
			'command_report': 'METER_REPORT',
			'command_report_parser': report => {
				if (report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale') &&
					report.Properties2.Scale === 0)
					return report['Meter Value (Parsed)'];

				return null;
			}
		},
		measure_temperature: {
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				return report['Sensor Value (Parsed)'] + temperature_offset;
			}
		}
	},
	settings: {
		temperature_offset: newValue => {
			temperature_offset = newValue;
		}
	}
});

module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];
	if (node) {
		module.exports.getSettings( node.device_data, (err, settings) => {
			if (settings && settings.hasOwnProperty('temperature_offset')) {
				temperature_offset = settings.temperature_offset;
			}
		});
	}
});