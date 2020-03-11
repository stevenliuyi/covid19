import React from 'react'
import format from 'date-fns/format'
import i18n from '../data/i18n.yml'
import { parseDate, formatDate } from './utils'

const integerFormat = (e) =>
    parseInt(e, 10) !== e
        ? ''
        : Math.abs(e) < 1000
          ? e
          : Math.abs(e) < 10 ** 6 ? `${e / 1000}K` : Math.abs(e) < 10 ** 9 ? `${e / 10 ** 6}M` : `${e / 10 ** 9}B`

const absIntegerFormat = (e) =>
    parseInt(e, 10) !== e ? '' : Math.abs(e) < 1000 ? Math.abs(e) : `${Math.abs(e) / 1000}K`

const streamTimeFormat = (idx, interval, dates) => (idx % interval === 0 ? format(parseDate(dates[idx]), 'M/d') : '')

const regionLegends = {
    anchor: 'right',
    direction: 'column',
    translateX: 100,
    itemWidth: 90,
    itemHeight: 20,
    itemTextColor: '#000',
    symbolSize: 12,
    symbolShape: 'circle'
}

export const getSpecificPlotType = (plotType, plotDetails) => {
    let specificType = ''
    if (plotType === 'plot_basic') {
        specificType = plotDetails.stats === 'cumulative' ? 'total' : 'new'
    } else if (plotType === 'plot_fatality_recovery') {
        specificType = 'fatality_recovery'
    } else if (plotType === 'plot_growth') {
        specificType = 'growth'
    } else if (plotType === 'plot_one_vs_rest') {
        specificType = plotDetails.stats === 'cumulative' ? 'one_vs_rest' : 'one_vs_rest_new'
    } else if (plotType === 'fatality_line') {
        specificType = 'fatality_line'
    } else if (plotType === 'fatality_line2') {
        specificType = 'fatality_line2'
    } else if (plotType === 'plot_ranking') {
        specificType = plotDetails.stats === 'cumulative' ? 'most_affected_subregions' : 'most_affected_subregions_new'
    } else if (plotType === 'plot_subregion_basic') {
        specificType = plotDetails.stats === 'cumulative' ? 'subregion_total' : 'subregion_new'
    } else if (plotType === 'plot_subregion_stream') {
        specificType = plotDetails.stats === 'cumulative' ? 'subregion_total_stream' : 'subregion_new_stream'
    } else if (plotType === 'plot_subregion_active_stream') {
        specificType = 'subregion_active_stream'
    } else if (plotType === 'plot_subregion_fatality') {
        specificType = 'subregion_fatality'
    }

    return specificType
}

export const plotTypes = {
    plot_basic: {
        subregions: false,
        metricChange: false,
        statsChange: true,
        text: i18n.CASES
    },
    plot_fatality_recovery: {
        subregions: false,
        metricChange: false,
        statsChange: false,
        text: i18n.FATALITY_RECOVERY_RATE
    },
    plot_growth: {
        subregions: false,
        metricChange: true,
        statsChange: false,
        text: i18n.GROWTH_RATE
    },
    plot_one_vs_rest: {
        subregions: false,
        metricChange: true,
        statsChange: true,
        text: i18n.ONE_VS_REST
    },
    fatality_line: {
        subregions: false,
        metricChange: false,
        statsChange: false,
        text: i18n.FATALITY_LINE
    },
    fatality_line2: {
        subregions: false,
        metricChange: false,
        statsChange: false,
        text: i18n.FATALITY_LINE2
    },
    plot_ranking: {
        subregions: true,
        metricChange: true,
        statsChange: true,
        text: i18n.MOST_AFFECTED_SUBREGIONS
    },
    plot_subregion_basic: {
        subregions: true,
        metricChange: true,
        statsChange: true,
        text: i18n.SUBREGION
    },
    plot_subregion_stream: {
        subregions: true,
        metricChange: true,
        statsChange: true,
        text: i18n.SUBREGION_STREAM
    },
    plot_subregion_active_stream: {
        subregions: false,
        metricChange: false,
        statsChange: false,
        text: i18n.SUBREGION_ACTIVE_STREAM
    },
    plot_subregion_fatality: {
        subregions: true,
        metricChange: false,
        statsChange: false,
        text: i18n.SUBREGION_FATALITY
    }
}

export const plotSpecificTypes = {
    total: {
        type: 'line',
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: true,
        legendItemWidth: 100
    },
    new: {
        type: 'line',
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: false,
        legendItemWidth: 100
    },
    fatality_recovery: {
        type: 'line',
        yAxisFormat: '.2%',
        xAxisFormat: '%-m/%-d',
        yFormat: '.2%',
        log: false,
        legendItemWidth: 150
    },
    growth: {
        type: 'line',
        yAxisFormat: '.0%',
        xAxisFormat: '%-m/%-d',
        yFormat: '.2%',
        log: false,
        legends: [],
        yScale: {
            type: 'linear',
            min: -2,
            max: 2
        }
    },
    one_vs_rest: {
        type: 'line',
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: true,
        legendItemWidth: 150
    },
    one_vs_rest_new: {
        type: 'line',
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: false,
        legendItemWidth: 150
    },
    fatality_line: {
        type: 'line',
        xFormat: ',d',
        yFormat: '.2%',
        xScale: {
            type: 'log',
            min: 1,
            max: 10 ** 9
        },
        yScale: {
            type: 'linear',
            min: 0,
            max: 0.4
        },
        xAxisFormat: integerFormat,
        yAxisFormat: '.0%',
        legends: [],
        hideMarkers: true,
        pointSize: 4,
        xTickValues: [ ...Array(10).keys() ].map((x) => 10 ** x),
        yTickValues: [ 0, 0.1, 0.2, 0.3, 0.4 ],
        xLegend: i18n.INFECTION_NUMBER,
        yLegend: i18n.FATALITY_RATE,
        enablePointLabel: true,
        enableSlices: false,
        pointLabel: (x) => x.name,
        tooltip: ({ point }) => (
            <div className="plot-tooltip plot-tooltip-line">
                <div className={point.data.name ? 'plot-tooltip-bold' : ''}>
                    {!point.data.name ? (
                        formatDate(point.data.date, point.data.lang)
                    ) : (
                        `${point.data.name} (${point.data.years})`
                    )}
                </div>
                <div>
                    <span>{i18n.FATALITY_RATE[point.data.lang]}</span>
                    <span className="plot-tooltip-bold">{` ${point.data.yFormatted}`}</span>
                </div>
                <div>
                    <span>{i18n.INFECTION_NUMBER[point.data.lang]}</span>
                    <span className="plot-tooltip-bold">{` ${point.data.xFormatted}`}</span>
                </div>
            </div>
        )
    },
    fatality_line2: {
        type: 'line',
        xFormat: ',d',
        yFormat: ',d',
        xScale: {
            type: 'log',
            min: 1,
            max: 10 ** 9
        },
        yScale: {
            type: 'log',
            min: 1,
            max: 10 ** 8
        },
        xAxisFormat: integerFormat,
        yAxisFormat: integerFormat,
        legends: [],
        hideMarkers: true,
        pointSize: 4,
        xTickValues: [ ...Array(10).keys() ].map((x) => 10 ** x),
        yTickValues: [ ...Array(9).keys() ].map((x) => 10 ** x),
        xLegend: i18n.INFECTION_NUMBER,
        yLegend: i18n.DEATH_NUMBER,
        enablePointLabel: true,
        enableSlices: false,
        pointLabel: (x) =>
            x.name === '中东呼吸综合征'
                ? `${x.name}${'　'.repeat(8)}`
                : x.name === 'MERS' ? `${x.name}${'　'.repeat(3)}` : x.name,
        tooltip: ({ point }) => (
            <div className="plot-tooltip plot-tooltip-line">
                <div className={point.data.name ? 'plot-tooltip-bold' : ''}>
                    {!point.data.name ? (
                        formatDate(point.data.date, point.data.lang)
                    ) : (
                        `${point.data.name} (${point.data.years})`
                    )}
                </div>
                <div>
                    <span>{i18n.DEATH_NUMBER[point.data.lang]}</span>
                    <span className="plot-tooltip-bold">{` ${point.data.yFormatted}`}</span>
                </div>
                <div>
                    <span>{i18n.INFECTION_NUMBER[point.data.lang]}</span>
                    <span className="plot-tooltip-bold">{` ${point.data.xFormatted}`}</span>
                </div>
            </div>
        )
    },
    most_affected_subregions: {
        type: 'bump',
        log: false,
        tooltip: ({ serie }) => (
            <span className="plot-tooltip plot-tooltip-bump" style={{ color: serie.color }}>
                {serie.fullId}
                <span className="plot-tooltip-bold">{` ${serie.count}`}</span>
            </span>
        )
    },
    most_affected_subregions_new: {
        type: 'bump',
        log: false,
        tooltip: ({ serie }) => (
            <span className="plot-tooltip plot-tooltip-bump" style={{ color: serie.color }}>
                {serie.fullId}
                <span className="plot-tooltip-bold">{` ${serie.count}`}</span>
            </span>
        )
    },
    subregion_total: {
        type: 'line',
        margin: { right: 115, bottom: 30 },
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: true,
        pointSize: 0,
        legends: [ regionLegends ]
    },
    subregion_new: {
        type: 'line',
        margin: { right: 115, bottom: 30 },
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: false,
        pointSize: 0,
        legends: [ regionLegends ]
    },
    subregion_total_stream: {
        type: 'stream',
        yAxisFormat: absIntegerFormat,
        xAxisFormat: streamTimeFormat,
        log: false,
        legends: [ regionLegends ]
    },
    subregion_new_stream: {
        type: 'stream',
        yAxisFormat: absIntegerFormat,
        xAxisFormat: streamTimeFormat,
        log: false,
        legends: [ regionLegends ]
    },
    subregion_active_stream: {
        type: 'stream',
        yAxisFormat: absIntegerFormat,
        xAxisFormat: streamTimeFormat,
        log: false,
        legends: [ regionLegends ]
    },
    subregion_fatality: {
        type: 'line',
        subregions: true,
        log: false,
        xLog: true,
        margin: { left: 60 },
        xFormat: ',d',
        yFormat: '.2%',
        xAxisFormat: integerFormat,
        yAxisFormat: '.1%',
        legends: [],
        hideMarkers: true,
        pointSize: 10,
        pointBorderWidth: 2,
        xTickValues: [ ...Array(10).keys() ].map((x) => 10 ** x),
        xLegend: i18n.CONFIRMED,
        yLegend: i18n.FATALITY_RATE,
        yLegendOffset: -50,
        enableSlices: false,
        tooltip: ({ point }) => (
            <div className="plot-tooltip plot-tooltip-line">
                <div className="plot-tooltip-bold">{point.data.name}</div>
                <div>
                    <span>{i18n.FATALITY_RATE[point.data.lang]}</span>
                    <span className="plot-tooltip-bold">{` ${point.data.yFormatted}`}</span>
                </div>
                <div>
                    <span>{i18n.CONFIRMED[point.data.lang]}</span>
                    <span className="plot-tooltip-bold">{` ${point.data.xFormatted}`}</span>
                </div>
            </div>
        )
    }
}
