import React, { Component, Fragment } from 'react'
import { Container, Row, Col } from 'reactstrap'
import ReactTooltip from 'react-tooltip'
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from 'react-icons/ai'
import Helmet from 'react-helmet'
import Measure from 'react-measure'
import './App.css'
import Map from './Map'
import MapNavBar from './MapNavBar'
import DateSlider from './DateSlider'
import AnimationController from './AnimationController'
import MainCounts from './MainCounts'
import Plot from './Plot'
import Tree from './Tree'
import NavBar from './NavBar'
import Loading from './Loading'
import Footer from './Footer'
import Region from './Region'
import TransmissionNetwork from './TransmissionNetwork'
import { ReactComponent as Icon } from '../covid19.svg'
import i18n from '../data/i18n.yml'
import * as str from '../utils/strings'
import { updateDarkMode } from '../utils/utils'
import { mapText } from '../utils/map_text'

const defaultState = {
    currentMap: 'WORLD',
    metric: 'confirmedCount',
    currentRegion: [ str.GLOBAL_ZH ],
    playing: false,
    scale: 'linear',
    mapZoom: 1,
    fullMap: false,
    fullPlot: false,
    plotType: 'plot_basic'
}
class App extends Component {
    state = {
        startDate: '2020-01-24',
        endDate: '2020-02-14',
        date: '2020-02-14',
        tempDate: '2020-02-14',
        data: null,
        dataLoaded: false,
        lang: 'en',
        darkMode: true,
        mapDimensions: {
            width: -1,
            height: -1
        },
        fullDimensions: {
            width: -1,
            height: -1
        },
        ...defaultState
    }

    fetchData = () =>
        fetch('data/all.json').then((res) => res.json()).then((res) => {
            const latest = Object.keys(res[str.GLOBAL_ZH].confirmedCount).pop()
            this.setState({ data: res, dataLoaded: true, date: latest, tempDate: latest, endDate: latest })
            this.tooltipRebuild()
        })

    componentDidMount() {
        updateDarkMode(this.state.darkMode)
        this.fetchData()
        this.updateFullDimensions()
        window.addEventListener('resize', this.updateFullDimensions)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateFullDimensions)
    }

    updateFullDimensions = () => {
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
        const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight

        if (height < 750 || width < 992) {
            if (this.state.fullMap) this.setState({ fullMap: false })
            if (this.state.fullPlot) this.setState({ fullPlot: false })
        }

        this.setState({
            fullDimensions: {
                height: Math.min(height - 250, (width - 200) * 3 / 4),
                width: Math.min((height - 250) * 4 / 3, width - 200)
            }
        })
    }

    reset = () =>
        this.setState({
            ...defaultState,
            date: this.state.endDate,
            tempDate: this.state.endDate
        })

    mapToggle = (newMap) =>
        this.setState({
            currentMap: newMap,
            // do not reset map zoom when switching between two China maps
            mapZoom: newMap === str.WORLD_MAP || this.state.currentMap === str.WORLD_MAP ? 1 : this.state.mapZoom
        })

    metricToggle = (newMetric) => this.setState({ metric: newMetric })

    regionToggle = (newRegion, mapChange = true) => {
        const { currentMap } = this.state
        this.setState({ currentRegion: newRegion })
        if (!mapChange) return

        if (currentMap === str.TRANSMISSION) return

        if (newRegion[0] === str.CHINA_ZH) {
            if (newRegion.length >= 4) {
                this.mapToggle(str.CHINA_MAP2)
            } else if (currentMap !== str.CHINA_MAP2) {
                this.mapToggle(str.CHINA_MAP1)
            }
        } else {
            let map = Object.keys(mapText).find((x) => mapText[x].regionName === newRegion[0])
            map = map != null ? map : str.WORLD_MAP
            this.mapToggle(map)
        }
    }

    playingToggle = () => this.setState({ playing: !this.state.playing })

    scaleToggle = (newScale) => this.setState({ scale: newScale })

    languageToggle = () => this.setState({ lang: this.state.lang === 'en' ? 'zh' : 'en' })

    fullMapToggle = () => {
        this.setState({ fullMap: !this.state.fullMap })
    }

    fullPlotToggle = () => {
        ReactTooltip.hide()
        this.setState({ fullPlot: !this.state.fullPlot })
    }

    darkModeToggle = () => {
        updateDarkMode(!this.state.darkMode)
        this.setState({ darkMode: !this.state.darkMode })
    }

    handleMapZoomChange = (newZoom) => this.setState({ mapZoom: newZoom })

    handleDateChange = (newDate) => this.setState({ date: newDate, tempDate: newDate })

    handleTempDateChange = (newDate) => this.setState({ tempDate: newDate })

    handlePlotTypeChange = (newType) => this.setState({ plotType: newType })

    tooltipRebuild = () => ReactTooltip.rebuild()

    render() {
        const { lang, dataLoaded, currentMap, fullMap, fullPlot, darkMode } = this.state
        const FullScreenIcon = fullMap ? AiOutlineFullscreenExit : AiOutlineFullscreen

        return (
            <div className={`App ${darkMode ? 'dark' : ''}`}>
                <Helmet>
                    <title>{i18n.COVID19[lang]}</title>
                </Helmet>
                {!dataLoaded ? (
                    <Loading />
                ) : (
                    <Fragment>
                        <Container className={`app-container ${fullMap ? 'map-full' : fullPlot ? 'plot-full' : ''}`}>
                            <Row>
                                <Col lg={!fullMap ? 7 : 12}>
                                    <div className="header">
                                        <span className="header-icon" style={{ opacity: dataLoaded ? 1 : 0 }}>
                                            <Icon />
                                        </span>
                                        <span
                                            className="header-title"
                                            style={{ letterSpacing: lang === 'zh' ? '1px' : 'normal' }}
                                        >
                                            {i18n.COVID19[lang]}
                                        </span>
                                    </div>
                                    <NavBar
                                        {...this.state}
                                        scaleToggle={this.scaleToggle}
                                        languageToggle={this.languageToggle}
                                        darkModeToggle={this.darkModeToggle}
                                        reset={this.reset}
                                    />
                                    {!fullPlot && (
                                        <Measure
                                            bounds
                                            onResize={(contentRect) => {
                                                this.setState({ mapDimensions: contentRect.bounds })
                                            }}
                                        >
                                            {({ measureRef }) => (
                                                <div
                                                    ref={measureRef}
                                                    className="map"
                                                    style={{
                                                        height: !fullMap
                                                            ? this.state.mapDimensions.width * 3 / 4
                                                            : this.state.fullDimensions.height,
                                                        width: !fullMap ? '100%' : this.state.fullDimensions.width
                                                    }}
                                                >
                                                    {currentMap === str.TRANSMISSION && (
                                                        <TransmissionNetwork
                                                            {...this.state}
                                                            regionToggle={this.regionToggle}
                                                            tooltipRebuild={this.tooltipRebuild}
                                                        />
                                                    )}
                                                    {currentMap !== str.TRANSMISSION && (
                                                        <Map
                                                            {...this.state}
                                                            handleMapZoomChange={this.handleMapZoomChange}
                                                            mapToggle={this.mapToggle}
                                                            regionToggle={this.regionToggle}
                                                            tooltipRebuild={this.tooltipRebuild}
                                                        />
                                                    )}
                                                    <div className="map-full-button">
                                                        <FullScreenIcon
                                                            size={fullMap ? 30 : 20}
                                                            onClick={this.fullMapToggle}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </Measure>
                                    )}
                                    <MapNavBar
                                        {...this.state}
                                        mapToggle={this.mapToggle}
                                        metricToggle={this.metricToggle}
                                        regionToggle={this.regionToggle}
                                    />
                                    <DateSlider
                                        {...this.state}
                                        handleDateChange={this.handleDateChange}
                                        handleTempDateChange={this.handleTempDateChange}
                                    />
                                    <AnimationController
                                        {...this.state}
                                        handleDateChange={this.handleDateChange}
                                        playingToggle={this.playingToggle}
                                    />
                                    <div className="footer-white" />
                                </Col>
                                {!fullMap && (
                                    <Col lg={!fullPlot ? 5 : 12} className="col-right">
                                        <Row style={{ display: 'flex', flexDirection: 'column', padding: 10 }}>
                                            <Region
                                                {...this.state}
                                                regionToggle={this.regionToggle}
                                                ReactTooltip={ReactTooltip}
                                            />
                                            <MainCounts {...this.state} />
                                            <Plot
                                                {...this.state}
                                                regionToggle={this.regionToggle}
                                                fullPlotToggle={this.fullPlotToggle}
                                                scaleToggle={this.scaleToggle}
                                                handlePlotTypeChange={this.handlePlotTypeChange}
                                            />
                                            <Tree {...this.state} regionToggle={this.regionToggle} />
                                            <div className="footer-placeholder" />
                                        </Row>
                                    </Col>
                                )}
                            </Row>
                        </Container>
                        <Footer {...this.state} />
                    </Fragment>
                )}
                <ReactTooltip className="plot-tooltip" type={darkMode ? 'dark' : 'light'} html={true} />
            </div>
        )
    }
}

export default App
