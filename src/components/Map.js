import React, { Component } from 'react'
import { ComposableMap, ZoomableGroup, Geographies, Geography, Marker } from 'react-simple-maps'
import { scaleSequential, scaleLog, scaleLinear } from 'd3-scale'
import { interpolateMagma } from 'd3-scale-chromatic'
import ReactTooltip from 'react-tooltip'
import { PatternLines } from '@vx/pattern'
import { isMobile } from 'react-device-detect'
import maps from '../data/maps.yml'

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
                ReactTooltip.rebuild()
            }, 100)
        }
    }

    handleGeographyClick = (geo) => () => {
        if (!this.state.clicked) return
        //this.setState({ zoom: 4 })
        const currentMap = maps[this.props.currentMap]
        const region = geo[currentMap.name_key.zh]
        this.props.handleRegionChange(region)

        if (region === '中国') this.props.mapToggle('CHN1')
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
                        stroke="#776865"
                        strokeWidth={1}
                        background="#FFF"
                        orientation={[ 'diagonal' ]}
                    />
                    <ZoomableGroup
                        zoom={mapZoom}
                        onZoomEnd={this.onZoomEnd}
                        onMoveStart={(e, m) => this.setState({ cursor: [ m.x, m.y ], clicked: false })}
                        onMoveEnd={(e, m) => {
                            // click
                            if (Math.abs(m.x - this.state.cursor[0]) < 1 && Math.abs(m.y - this.state.cursor[1]) < 1)
                                this.setState({ clicked: true })
                        }}
                        center={
                            this.state.center ? (
                                this.state.center
                            ) : (
                                currentMap.center.split(',').map((d) => parseInt(d, 10))
                            )
                        }
                        disableZooming={isMobile}
                    >
                        <Geographies
                            geography={`maps/${currentMap.filename}`}
                            onMouseEnter={() => {
                                if (!this.state.loaded) {
                                    this.setState({ loaded: true })
                                    ReactTooltip.rebuild()
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
                                    let isCurrentRegion =
                                        geo.properties[currentMap.name_key.zh] ===
                                        currentRegion[currentRegion.length - 1]

                                    // highlight all cities in the province
                                    if (
                                        this.props.currentMap === 'CHN2' &&
                                        geo.properties['NL_NAME_1'] === currentRegion[currentRegion.length - 1]
                                    )
                                        isCurrentRegion = true
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            className="map-geography"
                                            geography={geo}
                                            data-tip={`${name} <span class="plot-tooltip-bold">${counts}</span>`}
                                            style={{
                                                default: {
                                                    fill: counts > 0 ? colorScale(counts) : 'url("#lines")',
                                                    stroke: isCurrentRegion ? '#555' : '#FFF',
                                                    strokeWidth: isCurrentRegion ? 1 : 0
                                                },
                                                hover: {
                                                    fill: '#555',
                                                    stroke: '#FFF',
                                                    strokeWidth: 0,
                                                    cursor: counts > 0 ? 'pointer' : 'default'
                                                }
                                            }}
                                            onClick={this.handleGeographyClick(geo.properties)}
                                        />
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
                <ReactTooltip type="light" className="plot-tooltip" html={true} />
            </div>
        )
    }
}

export default Map
