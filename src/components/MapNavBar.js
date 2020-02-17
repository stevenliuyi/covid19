import React, { Component } from 'react'
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { FiMap } from 'react-icons/fi'
import TextTransition from 'react-text-transition'
import { metricText } from '../utils/utils'
import i18n from '../data/i18n.yml'
import * as str from '../utils/strings'

const mapText = {
    WORLD: i18n.WORLD_MAP,
    CHN1: i18n.CHINA_MAP1,
    CHN2: i18n.CHINA_MAP2
}

export default class MapNavBar extends Component {
    state = {
        dropdownOpen: false
    }

    mapToggle = (event) => {
        const map = event.target.getAttribute('value')
        if (map !== this.props.currentMap) {
            this.props.mapToggle(map)
            if (map === str.WORLD_MAP) this.props.regionToggle([ str.GLOBAL_ZH ])
            if (map === str.CHINA_MAP1 || map === str.CHINA_MAP2) {
                if (this.props.currentMap === str.WORLD_MAP) this.props.regionToggle([ str.CHINA_ZH ])
            }
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
                    {Object.keys(metricText).map((count) => (
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
                        <FiMap size={14} style={{ marginRight: 8 }} />
                        <TextTransition text={mapText[currentMap][lang]} noOverflow />
                    </DropdownToggle>
                    <DropdownMenu>
                        {Object.keys(mapText).map((map) => (
                            <DropdownItem key={`map-${map}`} value={map} onClick={this.mapToggle}>
                                {mapText[map][lang]}
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </UncontrolledDropdown>
            </div>
        )
    }
}
