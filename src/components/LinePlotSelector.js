import React, { Component, Fragment } from 'react'
import { MdArrowDropDownCircle } from 'react-icons/md'
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { plotTypes } from '../utils/plot_types'
import { getDataFromRegion } from '../utils/utils'
import * as str from '../utils/strings'
import i18n from '../data/i18n.yml'

export default class LinePlotSelector extends Component {
    state = {
        dropdownOpen: false
    }

    render() {
        const { currentPlotType, currentRegion, lang, data, onPlotTypeChange } = this.props
        const plotParameters = plotTypes[currentPlotType]
        const currentRegionIsGlobal = currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH
        const hasSubregions = Object.keys(getDataFromRegion(data, currentRegion)).length > 4 || currentRegionIsGlobal

        return (
            <UncontrolledDropdown className="">
                <DropdownToggle
                    tag="span"
                    className="line-plot-title"
                    data-toggle="dropdown"
                    aria-expanded={this.state.dropdownOpen}
                >
                    <span>{plotParameters.text[lang]}</span>
                    <MdArrowDropDownCircle size={20} className="dropdown-arrow" />
                </DropdownToggle>
                <DropdownMenu>
                    {Object.keys(plotTypes).map(
                        (plotType) =>
                            // no One-vs-Rest comparison plot when current region is Global
                            plotType === 'one_vs_rest' && currentRegionIsGlobal ? (
                                <div key={`dropdown-${plotType}`} />
                            ) : plotTypes[plotType].subregions && !hasSubregions ? (
                                <div key={`dropdown-${plotType}`} />
                            ) : (
                                <Fragment key={`dropdown-${plotType}`}>
                                    {plotType === 'total' &&
                                    hasSubregions && <DropdownItem header>{i18n.OVERALL[lang]}</DropdownItem>}
                                    {plotType === 'most_affected_subregions' &&
                                    hasSubregions && <DropdownItem header>{i18n.SUBREGIONS[lang]}</DropdownItem>}
                                    <DropdownItem
                                        className={currentPlotType === plotType ? 'current' : ''}
                                        onClick={() => {
                                            onPlotTypeChange(plotType)
                                            this.setState({
                                                dropdownOpen: !this.state.dropdownOpen
                                            })
                                        }}
                                    >
                                        {plotTypes[plotType].text[lang]}
                                    </DropdownItem>
                                </Fragment>
                            )
                    )}
                </DropdownMenu>
            </UncontrolledDropdown>
        )
    }
}
