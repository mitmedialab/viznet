import _ from 'underscore'
import vegaEmbed from 'vega-embed'

export default function renderCorrectTimeSeries(elm, responses) {
	const booleanResponses = responses.map(r => r.isCorrect);
	let cumulativeCorrect;
	let cumulativeCorrectPercent;

	cumulativeCorrect = booleanResponses.reduce(( previous, current, i) => {
		previous.push(previous.length && previous[previous.length - 1] + +current);
		return previous;
	}, []);
	cumulativeCorrectPercent = cumulativeCorrect.map((e, i) => ({
		vote: ( i + 1 ),
		percent: e / ( i + 1)
	}));

	let spec = {
		"$schema": "https://vega.github.io/schema/vega-lite/v2.json",
		"width": 300,
		"height": 200,
		"layer": [{
			"data": {
				"values": cumulativeCorrectPercent
			},
			"layer": [{
				"mark": {
					"type": "line",
					"interpolate": "step-after"
				},
				"encoding": {
					"x": {"field": "vote", "type": "ordinal", "axis": {"labelAngle": 0}},
					"y": {"field": "percent", "type": "quantitative", "scale": { "domain": [0, 1] }},
					"color": {"value": "#e45755"}
				}
			}, {
				"mark": {
					"type": "line",
					"interpolate": "step-after"
				},
				"transform": [
					{"filter": "datum.percent >= 0.5"},
					{"calculate": "0.5", "as": "baseline"}
				],
				"encoding": {
					"x": {"field": "vote", "type": "ordinal"},
					"y": {"field": "percent", "type": "quantitative", "scale": { "domain": [0, 1] } },
					"y2": {"field": "baseline", "type": "quantitative"},					
					"color": {"value": "green"}
				}
			}
			]}, 
			{
				"data": {
					"values": [
						{"ThresholdValue": 0.5, "Threshold": "Random"}
					]
				},
				"layer": [{
					"mark": "rule",
					"encoding": {
						"y": {"field": "ThresholdValue", "type": "quantitative"}
					}
				}, {
					"mark": {
						"type": "text",
						"align": "right",
						"dx": -2,
						"dy": -4
					},
					"encoding": {
						"x": {
							"value": "width",
							"axis": {"title": "Votes"}
						},
						"y": {
							"field": "ThresholdValue",
							"type": "quantitative",
							"axis": {"title": "Percent Correct"}
						},
						"text": {"field": "Threshold", "type": "ordinal"}
					}
				}]
			}
		]
	}
	vegaEmbed(elm, spec, { actions: false });
}