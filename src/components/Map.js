import React, { Component, Fragment } from 'react'
import { ComposableMap, ZoomableGroup, Geographies, Geography, Marker, Line } from 'react-simple-maps'
import { scaleSequential, scaleLog, scaleLinear } from 'd3-scale'
import { interpolateMagma } from 'd3-scale-chromatic'
import { PatternLines } from '@vx/pattern'
import { isMobile, isIPad13 } from 'react-device-detect'
import { TinyColor } from '@ctrl/tinycolor'
import { FaShip } from 'react-icons/fa'
import Toggle from 'react-toggle'
import 'react-toggle/style.css'
import maps from '../data/maps.yml'
import transmissions from '../data/transmissions.yml'
import coord from '../data/transmissions_coord.yml'
import { getDataFromRegion, parseDate } from '../utils/utils'
import * as str from '../utils/strings'

class Map extends Component {
    state = {
        center: null,
        loaded: false,
        cursor: [ 0, 0 ],
        clicked: false,
        showTransmissions: false
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.currentMap !== prevProps.currentMap) {
            this.setState({ loaded: false })
            setTimeout(() => {
                this.props.tooltipRebuild()
            }, 100)
        }
    }

    handleGeographyClick = (geo) => () => {
        if (!this.state.clicked) return
        //this.setState({ zoom: 4 })
        const currentMap = maps[this.props.currentMap]
        const region = geo[currentMap.name_key.zh]
        this.props.handleRegionChange(region)

        if (region === str.CHINA_ZH) this.props.mapToggle(str.CHINA_MAP1)
    }

    onZoomEnd = (event, state) => {
        this.props.handleMapZoomChange(state.zoom)
    }

    getConfig = (config, defaultConfig) =>
        config != null ? config.split(',').map((d) => parseInt(d, 10)) : defaultConfig

    render() {
        const currentMap = maps[this.props.currentMap]
        const { data, metric, date, scale, lang, currentRegion, mapZoom } = this.props
        const currentScale = scale === 'linear' ? scaleLinear : scaleLog

        const mapScale = currentScale().domain([ 1, currentMap[`maxScale_${metric}`] ])
        const colorScale = scaleSequential((d) => {
            return !this.state.showTransmissions || this.props.currentMap !== str.WORLD_MAP
                ? interpolateMagma(1 - mapScale(d))
                : new TinyColor(interpolateMagma(1 - mapScale(d))).desaturate(100).setAlpha(0.6).toRgbString()
        })

        const cruiseData = getDataFromRegion(data, [ str.INTL_CONVEYANCE_ZH, str.DIAMOND_PRINCESS_ZH ])
        const cruiseCounts = cruiseData[metric][date] ? cruiseData[metric][date] : 0

        const cruiseColor = new TinyColor(colorScale(cruiseCounts))
        const cruiseStrokeColor = cruiseColor.isDark()
            ? colorScale(mapScale.invert(Math.min(mapScale(cruiseCounts), 1) - 0.4))
            : colorScale(mapScale.invert(mapScale(cruiseCounts) + 0.15))

        return (
            <div className="map">
                {this.props.currentMap === str.WORLD_MAP && (
                    <div className="map-transmission-toggle-wrap">
                        <Toggle
                            className="map-transmission-toggle"
                            defaultChecked={this.state.showTransmissions}
                            onChange={() => this.setState({ showTransmissions: !this.state.showTransmissions })}
                            icons={false}
                        />
                        <span>Transmissions</span>
                    </div>
                )}
                <ComposableMap
                    projection={currentMap.projection}
                    projectionConfig={{
                        scale: currentMap.scale,
                        rotation: this.getConfig(currentMap.rotation, [ 0, 0, 0 ]),
                        parallels: this.getConfig(currentMap.parallels, [ 0, 0 ])
                    }}
                >
                    <PatternLines
                        id="lines"
                        height={6}
                        width={6}
                        stroke="#AAA"
                        strokeWidth={1}
                        background="#FFF"
                        orientation={[ 'diagonal' ]}
                    />
                    <ZoomableGroup
                        zoom={mapZoom}
                        onZoomEnd={this.onZoomEnd}
                        onMoveStart={(e, m) => this.setState({ cursor: [ m.x, m.y ], clicked: false })}
                        onMoveEnd={(e, m) => {
                            // click on desktop
                            if (Math.abs(m.x - this.state.cursor[0]) < 1 && Math.abs(m.y - this.state.cursor[1]) < 1)
                                this.setState({ clicked: true })
                        }}
                        onTouchStart={
                            // click on touch screens
                            isMobile || isIPad13 ? () => this.setState({ clicked: true }) : null
                        }
                        center={
                            this.state.center ? (
                                this.state.center
                            ) : (
                                currentMap.center.split(',').map((d) => parseInt(d, 10))
                            )
                        }
                        disableZooming={isMobile || isIPad13}
                        disablePanning={isMobile || isIPad13}
                    >
                        <Geographies
                            geography={`maps/${currentMap.filename}`}
                            onMouseEnter={() => {
                                if (!this.state.loaded) {
                                    this.setState({ loaded: true })
                                    this.props.tooltipRebuild()
                                }
                            }}
                        >
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const counts =
                                        geo.properties[metric] && geo.properties[metric][date]
                                            ? geo.properties[metric][date]
                                            : 0
                                    const name = geo.properties[currentMap.name_key[lang]]
                                    const id = geo.properties[currentMap.name_key.zh]
                                    let isCurrentRegion =
                                        geo.properties[currentMap.name_key.zh] ===
                                        currentRegion[currentRegion.length - 1]

                                    // highlight all cities in the province
                                    if (
                                        this.props.currentMap === str.CHINA_MAP2 &&
                                        geo.properties['NL_NAME_1'] === currentRegion[currentRegion.length - 1]
                                    )
                                        isCurrentRegion = true

                                    const tinyColor = new TinyColor(colorScale(counts))

                                    const strokeColor =
                                        counts === 0
                                            ? '#AAA'
                                            : tinyColor.isDark()
                                              ? colorScale(mapScale.invert(Math.min(mapScale(counts), 1) - 0.4))
                                              : colorScale(mapScale.invert(mapScale(counts) + 0.15))

                                    return (
                                        <Fragment key={`fragment-${geo.rsmKey}`}>
                                            <Geography
                                                key={geo.rsmKey}
                                                className="map-geography"
                                                geography={geo}
                                                data-tip={`${name} <span class="plot-tooltip-bold">${counts}</span>`}
                                                style={{
                                                    default: {
                                                        fill: isCurrentRegion
                                                            ? `url("#highlightLines-${id}") #AAA`
                                                            : counts > 0 ? colorScale(counts) : 'url("#lines")',
                                                        stroke: strokeColor,
                                                        strokeWidth: isCurrentRegion ? 1 : 0
                                                    },
                                                    hover: {
                                                        fill: `url("#highlightLines-${id}") #AAA`,
                                                        strokeWidth: 1,
                                                        stroke: strokeColor,
                                                        cursor: counts > 0 ? 'pointer' : 'default'
                                                    },
                                                    pressed: {
                                                        fill: `url("#highlightLines-${id}") #AAA`,
                                                        strokeWidth: 1,
                                                        stroke: strokeColor,
                                                        cursor: counts > 0 ? 'pointer' : 'default'
                                                    }
                                                }}
                                                onClick={this.handleGeographyClick(geo.properties)}
                                            />
                                            <PatternLines
                                                id={`highlightLines-${id}`}
                                                height={6}
                                                width={6}
                                                stroke={strokeColor}
                                                strokeWidth={1}
                                                background={counts === 0 ? '#FFF' : colorScale(counts)}
                                                orientation={[ 'diagonal' ]}
                                            />
                                        </Fragment>
                                    )
                                })}
                        </Geographies>
                        {this.props.currentMap === str.WORLD_MAP &&
                            this.state.showTransmissions &&
                            transmissions
                                .filter((trans) => parseDate(trans.date) <= parseDate(date))
                                .map((trans, i) => {
                                    return (
                                        <Line
                                            keys={`transmission-${i}`}
                                            from={coord[trans.from].split(',').map((c) => parseFloat(c))}
                                            to={coord[trans.to].split(',').map((c) => parseFloat(c))}
                                            stroke="rgba(222, 73, 104, 0.5)"
                                            strokeWidth={1}
                                            strokeLinecap="round"
                                            style={{
                                                pointerEvents: 'none'
                                            }}
                                        />
                                    )
                                })}
                        <Marker key={'wuhan'} coordinates={[ 114.2, 30.3 ]}>
                            <g
                                fill="none"
                                stroke="var(--primary-color-4)"
                                strokeWidth="2"
                                pointerEvents="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                transform="translate(-12, -24)"
                            >
                                <circle cx="12" cy="10" r="3" />
                                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
                            </g>
                        </Marker>
                        {this.props.currentMap === str.WORLD_MAP && (
                            <Marker key={'diamond-princess'} coordinates={[ 139.6, 35.4 ]}>
                                <FaShip
                                    size={18}
                                    color={colorScale(cruiseCounts)}
                                    className="map-ship"
                                    data-tip={`${lang === 'zh'
                                        ? str.DIAMOND_PRINCESS_ZH
                                        : cruiseData.ENGLISH} <span class="plot-tooltip-bold">${cruiseCounts}</span>`}
                                    style={{
                                        stroke: cruiseStrokeColor,
                                        visibility: cruiseCounts > 0 ? 'visible' : 'hidden',
                                        strokeWidth:
                                            currentRegion[currentRegion.length - 1] === str.DIAMOND_PRINCESS_ZH ? 30 : 0
                                    }}
                                    onClick={() =>
                                        this.props.regionToggle([ str.INTL_CONVEYANCE_ZH, str.DIAMOND_PRINCESS_ZH ])}
                                />
                            </Marker>
                        )}
                    </ZoomableGroup>
                </ComposableMap>
            </div>
        )
    }
}

export default Map
