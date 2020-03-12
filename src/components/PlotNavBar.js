import React, { Component } from 'react'
import RadioButton from './RadioButton'
import i18n from '../data/i18n.yml'
import { plotTypes, plotSpecificTypes } from '../utils/plot_types'

export default class PlotNavBar extends Component {
    render() {
        const { plotType, plotSpecificType, lang, onSelect, plotDetails, scale, scaleToggle } = this.props
        return (
            <div className="plot-nav-bar">
                {plotTypes[plotType].statsChange && (
                    <RadioButton
                        title={i18n.TYPE[lang]}
                        texts={{ cumulative: i18n.CUMULATIVE[lang], daily: i18n.DAILY[lang] }}
                        selected={plotDetails.stats}
                        onSelect={(s) => onSelect('stats', s)}
                        alwaysShow={true}
                    />
                )}
                {plotType === 'plot_fatality_line' && (
                    <RadioButton
                        title={i18n.Y_AXIS[lang]}
                        texts={{ rate: i18n.RATE[lang], deaths: i18n.DEATH_NUMBER2[lang] }}
                        selected={plotDetails.fatalityLine}
                        onSelect={(s) => onSelect('fatalityLine', s)}
                    />
                )}
                {plotType === 'plot_fatality_line' && (
                    <RadioButton
                        title={i18n.COMPARISONS[lang]}
                        texts={{ show: i18n.SHOW[lang], hide: i18n.HIDE[lang] }}
                        selected={plotDetails.diseaseComparison}
                        onSelect={(s) => onSelect('diseaseComparison', s)}
                    />
                )}
                {plotTypes[plotType].scaleChange && (
                    <RadioButton
                        title={i18n.SCALE[lang]}
                        texts={{ linear: i18n.LINEAR_SCALE[lang], log: i18n.LOG_SCALE[lang] }}
                        selected={scale}
                        onSelect={(s) => scaleToggle(s)}
                        disabled={plotSpecificTypes[plotSpecificType].log ? false : true}
                    />
                )}
                {plotSpecificTypes[plotSpecificType].type === 'stream' && (
                    <RadioButton
                        title={i18n.Y_AXIS[lang]}
                        texts={{ expand: i18n.PERCENT[lang], silhouette: i18n.CASE_NUMBERS[lang] }}
                        selected={plotDetails.stream}
                        onSelect={(s) => onSelect('stream', s)}
                    />
                )}
            </div>
        )
    }
}
