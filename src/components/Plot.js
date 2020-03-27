import React, { Component } from 'react'
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from 'react-icons/ai'
import { isMobile, isIPad13 } from 'react-device-detect'
import PlotSelector from './PlotSelector'
import PlotNavBar from './PlotNavBar'
import LinePlot from './LinePlot'
import StreamPlot from './StreamPlot'
import BumpPlot from './BumpPlot'
import { generatePlotData } from '../utils/plot_data'
import { getDataFromRegion } from '../utils/utils'
import { plotTypes, plotSpecificTypes, getSpecificPlotType } from '../utils/plot_types'
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

export default class Plot extends Component {
    state = {
        height: 290,
        plotDetails: {
            stats: 'cumulative',
            fatalityLine: 'rate',
            stream: 'silhouette',
            diseaseComparison: 'show',
            recoveryRate: 'show',
            movingAverage: '1d',
            shifted: '100'
        },
        plotSpecificType: 'total'
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

        if (currentRegionIsGlobal && this.props.plotType === 'plot_one_vs_rest') {
            this.props.handlePlotTypeChange('plot_basic')
            this.setSpecificPlotType('plot_basic', this.state.plotDetails)
        }

        if (!hasSubregions && plotTypes[this.props.plotType].subregions) {
            this.props.handlePlotTypeChange('plot_basic')
            this.setSpecificPlotType('plot_basic', this.state.plotDetails)
        }
    }

    updateHight = () => {
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)

        this.setState({
            height: vh < 850 && vw >= 992 ? 240 : 290
        })
    }

    onSelect = (s, v) => {
        let state = {}
        state.plotDetails = this.state.plotDetails
        state.plotDetails[s] = v

        this.setState(state)
        this.setSpecificPlotType(this.props.plotType, state.plotDetails)
    }

    setSpecificPlotType = (plotType, plotDetails) => {
        const specificType = getSpecificPlotType(plotType, plotDetails)

        this.setState({ plotSpecificType: specificType })
    }

    render() {
        const { plotType, data, lang, darkMode, fullPlot, fullTree, fullPlotToggle, fullDimensions } = this.props

        if (data == null || fullTree) return <div />

        const plotParameters = plotSpecificTypes[this.state.plotSpecificType]
        const plotDataAll = generatePlotData({
            ...this.props,
            plotSpecificType: this.state.plotSpecificType,
            plotDetails: this.state.plotDetails
        })
        const plotData = plotDataAll.plotData

        const isDataEmpty = ![ 'plot_subregion_active_stream', 'plot_subregion_stream' ].includes(plotType)
            ? plotData.map((d) => d.data.length).reduce((s, x) => s + x, 0) === 0
            : plotData.map((d) => Object.keys(d).length).reduce((s, x) => s + x, 0) === 0

        const tickValues = isDataEmpty ? 0 : plotDataAll.tickValues != null ? plotDataAll.tickValues : 5

        const FullScreenIcon = fullPlot ? AiOutlineFullscreenExit : AiOutlineFullscreen

        const plotProps = {
            ...this.props,
            plotParameters,
            plotDataAll,
            tickValues,
            plotTheme: plotTheme(darkMode, fullPlot)
        }

        return (
            <div
                className="plot-wrap"
                style={{
                    height: !fullPlot ? 'auto' : fullDimensions.height - 100,
                    width: !fullPlot ? '100%' : fullDimensions.width + 100
                }}
            >
                <PlotSelector
                    {...this.props}
                    {...this.state}
                    currentPlotType={plotType}
                    onPlotTypeChange={(plotType) => {
                        this.setSpecificPlotType(plotType, this.state.plotDetails)
                        this.props.handlePlotTypeChange(plotType)
                    }}
                />
                <div className="plot-with-nav-bar">
                    <PlotNavBar {...this.props} {...this.state} onSelect={this.onSelect} />
                    <div
                        style={{
                            height: !fullPlot ? this.state.height : fullDimensions.height - 125,
                            width: !fullPlot ? '100%' : fullDimensions.width - 70
                        }}
                    >
                        {isDataEmpty ? (
                            <div className="plot-no-data">
                                <span>{i18n.NO_DATA[lang]}</span>
                            </div>
                        ) : (
                            <div />
                        )}
                        {!isDataEmpty && <LinePlot {...plotProps} />}
                        {!isDataEmpty && <BumpPlot {...plotProps} />}
                        {!isDataEmpty && <StreamPlot offsetType={this.state.plotDetails.stream} {...plotProps} />}
                        <div
                            className="plot-full-button"
                            data-tip={!fullPlot && !isMobile && !isIPad13 ? i18n.PLOT_SETTINGS[lang] : ''}
                        >
                            <FullScreenIcon size={fullPlot ? 30 : 20} onClick={fullPlotToggle} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
