import React, { Component } from 'react'
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md'
import PlotSelector from './PlotSelector'
import LinePlot from './LinePlot'
import StreamPlot from './StreamPlot'
import BumpPlot from './BumpPlot'
import { generatePlotData } from '../utils/plot_data'
import { getDataFromRegion } from '../utils/utils'
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

export default class Plot extends Component {
    state = {
        height: 290
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

        if (currentRegionIsGlobal && this.props.plotType === 'one_vs_rest') this.props.handlePlotTypeChange('total')

        if (!hasSubregions && plotTypes[this.props.plotType].subregions) this.props.handlePlotTypeChange('total')
    }

    updateHight = () => {
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)

        this.setState({
            height: vh < 850 && vw >= 992 ? 240 : 290
        })
    }

    render() {
        const { plotType, data, lang, darkMode, fullPlot, fullPlotToggle, fullDimensions } = this.props

        if (data == null) return <div />

        const plotParameters = plotTypes[plotType]
        const plotDataAll = generatePlotData(this.props)
        const plotData = plotDataAll.plotData

        const isDataEmpty = ![ 'subregion_active_stream', 'subregion_total_stream' ].includes(plotType)
            ? plotData.map((d) => d.data.length).reduce((s, x) => s + x, 0) === 0
            : plotData.map((d) => Object.keys(d).length).reduce((s, x) => s + x, 0) === 0

        const tickValues = isDataEmpty ? 0 : plotDataAll.tickValues != null ? plotDataAll.tickValues : 5

        const FullScreenIcon = fullPlot ? MdFullscreenExit : MdFullscreen

        const plotProps = {
            ...this.props,
            plotParameters,
            plotDataAll,
            tickValues,
            plotTheme: plotTheme(darkMode, fullPlot)
        }

        return (
            <div className="plot-wrap">
                <PlotSelector
                    {...this.props}
                    currentPlotType={plotType}
                    onPlotTypeChange={this.props.handlePlotTypeChange}
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
                    {!isDataEmpty && <LinePlot {...plotProps} />}
                    {!isDataEmpty && <BumpPlot {...plotProps} />}
                    {!isDataEmpty && <StreamPlot {...plotProps} />}
                    <div className="plot-full-button">
                        <FullScreenIcon size={fullPlot ? 30 : 20} onClick={fullPlotToggle} />
                    </div>
                </div>
            </div>
        )
    }
}
