import React, { Component } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ResponsiveBump } from '@nivo/bump'
import { ResponsiveStream } from '@nivo/stream'
import { isMobile, isIPad13 } from 'react-device-detect'
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md'
import LinePlotSelector from './LinePlotSelector'
import { generatePlotData } from '../utils/plot_data'
import { parseDate, getDataFromRegion } from '../utils/utils'
import { plotTypes } from '../utils/plot_types'
import * as str from '../utils/strings'
import i18n from '../data/i18n.yml'

const plotTheme = (darkMode, fullMode) => {
    return {
        fontFamily: 'Saira, sans-serif',
        fontSize: fullMode ? 14 : 11,
        textColor: darkMode ? 'var(--lighter-grey)' : 'black',
        grid: {
            line: {
                stroke: darkMode ? 'var(--darkest-grey)' : 'var(--lighter-grey)'
            }
        },
        tooltip: {
            container: {
                background: darkMode ? 'var(--darkest-grey)' : 'white',
                color: darkMode ? 'var(--lighter-grey)' : 'black'
            }
        }
    }
}

export default class LinePlot extends Component {
    state = {
        height: 290,
        plotType: 'total'
    }

    componentDidMount() {
        this.updateHight()
        window.addEventListener('resize', this.updateHight)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateHight)
    }

    componentDidUpdate(prevProps, prevState) {
        const { data, currentRegion } = this.props
        const currentRegionIsGlobal = currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH
        const hasSubregions = Object.keys(getDataFromRegion(data, currentRegion)).length > 4 || currentRegionIsGlobal

        if (currentRegionIsGlobal && this.state.plotType === 'one_vs_rest')
            this.setState({
                plotType: 'total'
            })

        if (!hasSubregions && plotTypes[this.state.plotType].subregions)
            this.setState({
                plotType: 'total'
            })
    }

    updateHight = () => {
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)

        this.setState({
            height: vh < 850 && vw >= 992 ? 240 : 290
        })
    }

    onPlotTypeChange = (newType) => this.setState({ plotType: newType })

    render() {
        const {
            data,
            currentRegion,
            playing,
            tempDate,
            endDate,
            startDate,
            scale,
            lang,
            darkMode,
            fullPlot,
            fullPlotToggle,
            fullDimensions
        } = this.props

        if (data == null) return <div />

        const plotParameters = plotTypes[this.state.plotType]
        const plotDataAll = generatePlotData({ ...this.props, plotType: this.state.plotType })
        const plotData = plotDataAll.plotData

        const isDataEmpty = ![ 'subregion_active_stream', 'subregion_total_stream' ].includes(this.state.plotType)
            ? plotData.map((d) => d.data.length).reduce((s, x) => s + x, 0) === 0
            : plotData.map((d) => Object.keys(d).length).reduce((s, x) => s + x, 0) === 0

        const tickValues = isDataEmpty ? 0 : plotDataAll.tickValues != null ? plotDataAll.tickValues : 5

        const FullScreenIcon = fullPlot ? MdFullscreenExit : MdFullscreen

        return (
            <div className="plot-wrap">
                <LinePlotSelector
                    {...this.props}
                    currentPlotType={this.state.plotType}
                    onPlotTypeChange={this.onPlotTypeChange}
                />
                <div
                    style={{
                        height: !fullPlot ? this.state.height : fullDimensions.height - 150,
                        width: !fullPlot ? '100%' : fullDimensions.width
                    }}
                >
                    {isDataEmpty ? (
                        <div className="plot-no-data">
                            <span>{i18n.NO_DATA[lang]}</span>
                        </div>
                    ) : (
                        <div />
                    )}
                    {!isDataEmpty &&
                    plotParameters.type === 'line' && (
                        <ResponsiveLine
                            margin={{
                                top: 20,
                                right: 20,
                                bottom: !fullPlot ? 60 : 80,
                                left: 50,
                                ...plotParameters.margin
                            }}
                            theme={plotTheme(darkMode, fullPlot)}
                            animate={true}
                            data={plotData}
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
                                tickValues:
                                    plotParameters.yTickValues != null ? plotParameters.yTickValues : tickValues,
                                legend: plotParameters.yLegend != null ? plotParameters.yLegend[lang] : '',
                                legendOffset: plotParameters.yLegendOffset != null ? plotParameters.yLegendOffset : -40,
                                legendPosition: 'middle'
                            }}
                            axisBottom={{
                                orient: 'bottom',
                                format: plotParameters.xAxisFormat,
                                tickValues:
                                    plotParameters.xTickValues != null
                                        ? plotParameters.xTickValues
                                        : !fullPlot ? 5 : 10,
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
                            pointLabelYOffset={-6}
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
                            onClick={({ serieId }) => {
                                if (isMobile || isIPad13) return
                                if (!plotParameters.subregions || serieId == null) return
                                this.props.regionToggle(
                                    currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH
                                        ? [ serieId ]
                                        : [ ...currentRegion, serieId ]
                                )
                            }}
                        />
                    )}
                    {!isDataEmpty &&
                    plotParameters.type === 'bump' && (
                        <ResponsiveBump
                            data={plotData}
                            theme={plotTheme(darkMode, fullPlot)}
                            margin={{ top: 10, right: 100, bottom: 20, left: 50 }}
                            colors={(d) => d.color}
                            lineWidth={2}
                            activeLineWidth={4}
                            inactiveLineWidth={2}
                            inactiveOpacity={0.15}
                            pointSize={0}
                            activePointSize={0}
                            inactivePointSize={0}
                            pointBorderWidth={3}
                            activePointBorderWidth={3}
                            enableGridX={false}
                            enableGridY={false}
                            axisRight={null}
                            axisTop={null}
                            axisBottom={null}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0
                            }}
                            onClick={(serie) => {
                                if (isMobile || isIPad13) return
                                this.props.regionToggle(
                                    currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH
                                        ? [ serie.name ]
                                        : [ ...currentRegion, serie.name ]
                                )
                            }}
                            tooltip={plotParameters.tooltip}
                        />
                    )}
                    {!isDataEmpty &&
                    plotParameters.type === 'stream' && (
                        <ResponsiveStream
                            data={plotData}
                            keys={plotDataAll.plotKeys}
                            theme={plotTheme(darkMode, fullPlot)}
                            margin={{ top: 20, right: 115, bottom: 35, left: 40 }}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                orient: 'bottom',
                                tickSize: 0,
                                tickPadding: 5,
                                tickRotation: 0,
                                format: (idx) =>
                                    plotParameters.xAxisFormat(idx, Math.round(plotData.length / 5), plotDataAll.dates)
                            }}
                            axisLeft={{
                                orient: 'left',
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                tickValues: 5,
                                format: plotParameters.yAxisFormat
                            }}
                            offsetType="silhouette"
                            colors={(d) =>
                                darkMode
                                    ? [ 0, 1, 2, 3, 4, 5 ].map((x) => `var(--primary-color-${x})`)[
                                          plotDataAll.plotKeys.length - 1 - d.index
                                      ]
                                    : [ 8, 6, 5, 4, 3, 2 ].map((x) => `var(--primary-color-${x})`)[
                                          plotDataAll.plotKeys.length - 1 - d.index
                                      ]}
                            fillOpacity={0.85}
                            animate={false}
                            enableGridX={false}
                            enableGridY={true}
                            legends={plotParameters.legends}
                            isInteractive={true}
                            enableStackTooltip={true}
                            tooltipFormat={(x) => <b>{x.value}</b>}
                        />
                    )}
                    <div className="plot-full-button">
                        <FullScreenIcon size={fullPlot ? 30 : 20} onClick={fullPlotToggle} />
                    </div>
                </div>
            </div>
        )
    }
}
