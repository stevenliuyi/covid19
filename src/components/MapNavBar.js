import React, { Component, Fragment } from 'react'
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { FiMap } from 'react-icons/fi'
import { metricText } from '../utils/utils'
import i18n from '../data/i18n.yml'
import * as str from '../utils/strings'

const mapText = {
    WORLD: i18n.WORLD_MAP,
    CHN1: i18n.CHINA_MAP1,
    CHN2: i18n.CHINA_MAP2,
    KOR: i18n.KOREA_MAP,
    ITA: i18n.ITALY_MAP,
    US: i18n.US_MAP,
    TRANSMISSION: i18n.TRANSMISSION_NETWORK
}

export default class MapNavBar extends Component {
    state = {
        dropdownOpen: false
    }

    mapToggle = (event) => {
        const map = event.target.getAttribute('value')
        if (map !== this.props.currentMap) {
            this.props.mapToggle(map)
            if (map === str.WORLD_MAP) this.props.regionToggle([ str.GLOBAL_ZH ], false)
            if (map === str.CHINA_MAP1 || map === str.CHINA_MAP2) {
                if (this.props.currentMap !== str.CHINA_MAP1 && this.props.currentMap !== str.CHINA_MAP2)
                    this.props.regionToggle([ str.CHINA_ZH ], false)
            }
            if (map === str.KOREA_MAP) this.props.regionToggle([ str.KOREA_ZH ], false)
            if (map === str.ITALY_MAP) this.props.regionToggle([ str.ITALY_ZH ], false)
            if (map === str.US_MAP) this.props.regionToggle([ str.US_ZH ], false)
        }
        this.setState({ dropdownOpen: !this.state.dropdownOpen })
    }

    metricToggle = (event) => {
        const newMetric = event.target.getAttribute('value')
        if (newMetric !== this.props.metric) this.props.metricToggle(newMetric)
    }

    render() {
        const { lang, metric, currentMap } = this.props
        return (
            <div className="map-nav-bar-wrap">
                <ul className="map-nav-bar">
                    {[ 'confirmedCount', 'deadCount', 'curedCount' ].map((count) => (
                        <li key={`map-nav-${count}`} className={count === metric ? 'current' : ''}>
                            <div value={count} onClick={this.metricToggle}>
                                {metricText[count][lang]}
                            </div>
                        </li>
                    ))}
                </ul>

                <UncontrolledDropdown className="map-toggle">
                    <DropdownToggle
                        className="map-toggle-button"
                        tag="span"
                        data-toggle="dropdown"
                        aria-expanded={this.state.dropdownOpen}
                    >
                        <FiMap size={14} style={{ marginRight: 10 }} />
                        <span>{mapText[currentMap][lang]}</span>
                    </DropdownToggle>
                    <DropdownMenu>
                        {Object.keys(mapText).map((map, idx) => {
                            return (
                                <Fragment key={`map-${idx}`}>
                                    {map === str.TRANSMISSION ? <DropdownItem divider /> : <div />}
                                    <DropdownItem
                                        value={map}
                                        className={currentMap === map ? 'current' : ''}
                                        onClick={this.mapToggle}
                                    >
                                        {mapText[map][lang]}
                                    </DropdownItem>
                                </Fragment>
                            )
                        })}
                    </DropdownMenu>
                </UncontrolledDropdown>
            </div>
        )
    }
}
