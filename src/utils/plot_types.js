import React from 'react'
import i18n from '../data/i18n.yml'
import format from 'date-fns/format'
import { parseDate } from './utils'

export const integerFormat = (e) =>
    parseInt(e, 10) !== e
        ? ''
        : Math.abs(e) < 1000
          ? e
          : Math.abs(e) < 10 ** 6 ? `${e / 1000}K` : Math.abs(e) < 10 ** 9 ? `${e / 10 ** 6}M` : `${e / 10 ** 9}B`

export const absIntegerFormat = (e) =>
    parseInt(e, 10) !== e ? '' : Math.abs(e) < 1000 ? Math.abs(e) : `${Math.abs(e) / 1000}K`

export const streamTimeFormat = (idx, interval, dates) =>
    idx % interval === 0 ? format(parseDate(dates[idx]), 'M/d') : ''

export const plotTypes = {
    total: {
        type: 'line',
        text: i18n.TOTAL_CASES,
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: true,
        legendItemWidth: 100
    },
    new: {
        type: 'line',
        text: i18n.NEW_CASES,
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: false,
        legendItemWidth: 100
    },
    fatality_recovery: {
        type: 'line',
        text: i18n.FATALITY_RECOVERY_RATE,
        yAxisFormat: '.2%',
        xAxisFormat: '%-m/%-d',
        yFormat: '.2%',
        log: false,
        legendItemWidth: 150
    },
    one_vs_rest: {
        type: 'line',
        text: i18n.ONE_VS_REST,
        yAxisFormat: integerFormat,
        xAxisFormat: '%-m/%-d',
        log: true,
        legendItemWidth: 150
    },
    most_affected_subregions: {
        type: 'bump',
        text: i18n.MOST_AFFECTED_SUBREGIONS,
        log: false,
        tooltip: ({ serie }) => (
            <span className="plot-tooltip plot-tooltip-bump" style={{ color: serie.color }}>
                {serie.fullId}
                <span className="plot-tooltip-bold">{` ${serie.count}`}</span>
            </span>
        )
    },
    remaining_confirmed: {
        type: 'stream',
        text: i18n.REMAINING_CONFIRMED_CASES,
        yAxisFormat: absIntegerFormat,
        xAxisFormat: streamTimeFormat,
        log: false
    },
    mortality_line: {
        type: 'line',
        text: i18n.MORTALITY_LINE,
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
        hideLegends: true,
        hideMarkers: true,
        pointSize: 4,
        xTickValues: [ ...Array(10).keys() ].map((x) => 10 ** x),
        yTickValues: [ 0, 0.2, 0.4 ],
        xLegend: i18n.INFECTION_NUMBER,
        yLegend: i18n.FATALITY_RATE,
        enablePointLabel: true,
        enableSlices: false,
        pointLabel: (x) => x.name,
        tooltip: ({ point }) => (
            <div className="plot-tooltip plot-tooltip-line">
                <div className={point.data.name ? 'plot-tooltip-bold' : ''}>
                    {!point.data.name ? point.data.lang === 'zh' ? (
                        format(parseDate(point.data.date), 'yyyy年MMMd日')
                    ) : (
                        format(parseDate(point.data.date), 'MMM d, yyyy')
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
    mortality_line2: {
        type: 'line',
        text: i18n.MORTALITY_LINE2,
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
        hideLegends: true,
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
                    {!point.data.name ? point.data.lang === 'zh' ? (
                        format(parseDate(point.data.date), 'yyyy年MMMd日')
                    ) : (
                        format(parseDate(point.data.date), 'MMM d, yyyy')
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
    }
}
