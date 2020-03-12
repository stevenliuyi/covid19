import React, { Component } from 'react'
import RadioButton from './RadioButton'
import i18n from '../data/i18n.yml'
import { plotTypes } from '../utils/plot_types'

export default class PlotNavBar extends Component {
    render() {
        const { plotType, lang, onSelect, plotDetails } = this.props
        return (
            <div className="plot-nav-bar">
                {plotTypes[plotType].statsChange && (
                    <RadioButton
                        title={'Type'}
                        texts={{ cumulative: i18n.CUMULATIVE[lang], daily: i18n.DAILY[lang] }}
                        selected={plotDetails.stats}
                        onSelect={(s) => onSelect('stats', s)}
                        alwaysShow={true}
                    />
                )}
                {plotType === 'plot_fatality_line' && (
                    <RadioButton
                        title={'Y-Axis'}
                        texts={{ rate: i18n.RATE[lang], deaths: i18n.DEATHS[lang] }}
                        selected={plotDetails.fatalityLine}
                        onSelect={(s) => onSelect('fatalityLine', s)}
                    />
                )}
            </div>
        )
    }
}
