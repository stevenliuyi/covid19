import React, { Component, Fragment } from 'react'
import { ComposableMap, ZoomableGroup, Geographies, Geography, Marker } from 'react-simple-maps'
import { scaleSequential, scaleLog, scaleLinear } from 'd3-scale'
import { interpolateMagma } from 'd3-scale-chromatic'
import { PatternLines } from '@vx/pattern'
import { isMobile, isIPad13 } from 'react-device-detect'
import { TinyColor } from '@ctrl/tinycolor'
import maps from '../data/maps.yml'
import * as str from '../utils/strings'

class Map extends Component {
    state = {
        center: null,
        loaded: false,
        cursor: [ 0, 0 ],
        clicked: false
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
        const { metric, date, scale, lang, currentRegion, mapZoom } = this.props
        const currentScale = scale === 'linear' ? scaleLinear : scaleLog

        return (
            <div className="map">
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
                                    const mapScale = currentScale().domain([ 1, currentMap[`maxScale_${metric}`] ])
                                    const colorScale = scaleSequential((d) => {
                                        return interpolateMagma(1 - mapScale(d))
                                    })
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
                    </ZoomableGroup>
                </ComposableMap>
            </div>
        )
    }
}

export default Map
