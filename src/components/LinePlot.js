import React, { Component } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { isMobile, isIPad13 } from 'react-device-detect'
import { parseDate } from '../utils/utils'
import * as str from '../utils/strings'
import us_map from '../data/us_map.yml'

export default class LinePlot extends Component {
    render() {
        const {
            currentRegion,
            fullPlot,
            darkMode,
            scale,
            lang,
            playing,
            tempDate,
            startDate,
            endDate,
            plotParameters,
            plotDataAll,
            tickValues,
            plotTheme,
            currentMap
        } = this.props

        if (plotParameters.type !== 'line') return <div />

        return (
            <ResponsiveLine
                margin={{
                    top: 20,
                    right: 20,
                    bottom: !fullPlot ? 60 : 80,
                    left: 50,
                    ...plotParameters.margin
                }}
                theme={plotTheme}
                animate={
                    fullPlot ||
                    currentMap !== str.US_MAP2 ||
                    (currentMap === str.US_MAP2 && currentRegion.length >= 2 && currentRegion[1] in us_map)
                }
                data={plotDataAll.plotData}
                colors={(d) => d.color}
                xFormat={plotParameters.xFormat != null ? plotParameters.xFormat : 'time:%Y-%m-%d'}
                yFormat={plotParameters.yFormat}
                xScale={
                    plotParameters.xScale != null ? (
                        plotParameters.xScale
                    ) : !plotParameters.xLog ? (
                        {
                            type: 'time',
                            format: '%Y-%m-%d',
                            precision: 'day',
                            useUTC: false
                        }
                    ) : (
                        {
                            type: 'log',
                            min: plotDataAll.logTickMin,
                            max: plotDataAll.logTickMax
                        }
                    )
                }
                yScale={
                    plotParameters.yScale != null ? (
                        plotParameters.yScale
                    ) : scale === 'linear' || !plotParameters.log ? (
                        {
                            type: 'linear',
                            max: 'auto',
                            min: 'auto'
                        }
                    ) : (
                        {
                            type: 'log',
                            min: plotDataAll.logTickMin,
                            max: plotDataAll.logTickMax
                        }
                    )
                }
                axisLeft={{
                    orient: 'left',
                    // do not show ticks with non-integer values
                    format: plotParameters.yAxisFormat,
                    tickSize: 0,
                    tickValues: plotParameters.yTickValues != null ? plotParameters.yTickValues : tickValues,
                    legend: plotParameters.yLegend != null ? plotParameters.yLegend[lang] : '',
                    legendOffset: plotParameters.yLegendOffset != null ? plotParameters.yLegendOffset : -40,
                    legendPosition: 'middle'
                }}
                axisBottom={{
                    orient: 'bottom',
                    format:
                        Object(plotParameters.xAxisFormat) !== plotParameters.xAxisFormat
                            ? plotParameters.xAxisFormat
                            : plotParameters.xAxisFormat[lang],
                    tickValues: plotParameters.xTickValues != null ? plotParameters.xTickValues : !fullPlot ? 5 : 10,
                    tickRotation:
                        plotParameters.xTickRotation != null ? plotParameters.xTickRotation : !fullPlot ? 0 : -30,
                    legend: plotParameters.xLegend != null ? plotParameters.xLegend[lang] : '',
                    legendOffset: 40,
                    legendPosition: 'middle'
                }}
                enableGridX={false}
                gridYValues={plotParameters.yTickValues != null ? plotParameters.yTickValues : tickValues}
                pointSize={plotParameters.pointSize != null ? plotParameters.pointSize : 6}
                pointBorderWidth={plotParameters.pointBorderWidth}
                pointBorderColor={darkMode ? 'var(--primary-color-4)' : 'var(--primary-color-5)'}
                useMesh={true}
                enableArea={false}
                enablePointLabel={plotParameters.enablePointLabel}
                pointLabel={plotParameters.pointLabel}
                pointLabelYOffset={plotParameters.pointLabelYOffset ? plotParameters.pointLabelYOffset : -6}
                enableSlices={plotParameters.enableSlices != null ? plotParameters.enableSlices : 'x'}
                curve={'monotoneX'}
                tooltip={plotParameters.tooltip}
                markers={
                    plotParameters.hideMarkers ? (
                        []
                    ) : !playing && tempDate !== startDate && tempDate !== endDate ? (
                        [
                            {
                                axis: 'x',
                                value: parseDate(tempDate),
                                lineStyle: {
                                    stroke: darkMode ? 'var(--primary-color-4)' : 'var(--primary-color-5)',
                                    strokeWidth: 1,
                                    strokeDasharray: '6 6'
                                }
                            }
                        ]
                    ) : (
                        []
                    )
                }
                legends={
                    plotParameters.legends != null ? (
                        plotParameters.legends
                    ) : (
                        [
                            {
                                anchor: 'bottom',
                                direction: 'row',
                                justify: false,
                                translateX: 0,
                                translateY: !fullPlot ? 50 : 70,
                                itemsSpacing: 10,
                                itemDirection: 'left-to-right',
                                itemWidth: plotParameters.legendItemWidth,
                                itemHeight: 20,
                                itemOpacity: 0.75,
                                symbolSize: 12,
                                symbolShape: 'circle',
                                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                                effects: []
                            }
                        ]
                    )
                }
                onClick={({ serieId, data }) => {
                    if (isMobile || isIPad13) return
                    if (!plotParameters.subregions || serieId == null || data.noClick) return
                    this.props.regionToggle(
                        currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH
                            ? [ serieId ]
                            : [ ...currentRegion, serieId ]
                    )
                }}
            />
        )
    }
}
