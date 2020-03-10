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

export const plotTypes = {
    total: {
        type: 'line',
        text: i18n.TOTAL_CASES,
        metricChange: false,
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: true,
        legendItemWidth: 100
    },
    new: {
        type: 'line',
        text: i18n.NEW_CASES,
        metricChange: false,
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: false,
        legendItemWidth: 100
    },
    fatality_recovery: {
        type: 'line',
        text: i18n.FATALITY_RECOVERY_RATE,
        metricChange: false,
        yAxisFormat: '.2%',
        xAxisFormat: '%-m/%-d',
        yFormat: '.2%',
        log: false,
        legendItemWidth: 150
    },
    growth: {
        type: 'line',
        text: i18n.GROWTH_RATE,
        metricChange: true,
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
        text: i18n.ONE_VS_REST,
        metricChange: true,
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: true,
        legendItemWidth: 150
    },
    fatality_line: {
        type: 'line',
        text: i18n.FATALITY_LINE,
        metricChange: false,
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
        text: i18n.FATALITY_LINE2,
        metricChange: false,
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
        subregions: true,
        text: i18n.MOST_AFFECTED_SUBREGIONS,
        metricChange: true,
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
        subregions: true,
        text: i18n.SUBREGION_TOTAL,
        metricChange: true,
        margin: { right: 115, bottom: 30 },
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: true,
        pointSize: 0,
        legends: [ regionLegends ]
    },
    subregion_total_stream: {
        type: 'stream',
        subregions: true,
        text: i18n.SUBREGION_TOTAL_STREAM,
        metricChange: true,
        yAxisFormat: absIntegerFormat,
        xAxisFormat: streamTimeFormat,
        log: false,
        legends: [ regionLegends ]
    },
    subregion_active_stream: {
        type: 'stream',
        text: i18n.SUBREGION_ACTIVE_STREAM,
        metricChange: false,
        yAxisFormat: absIntegerFormat,
        xAxisFormat: streamTimeFormat,
        log: false,
        legends: [ regionLegends ]
    },
    subregion_fatality: {
        type: 'line',
        subregions: true,
        metricChange: false,
        log: false,
        xLog: true,
        text: i18n.SUBREGION_FATALITY,
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
