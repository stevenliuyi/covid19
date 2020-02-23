import React, { Component, Fragment } from 'react'
import { Container, Row, Col } from 'reactstrap'
import ReactTooltip from 'react-tooltip'
import './App.css'
import Map from './Map'
import MapNavBar from './MapNavBar'
import DateSlider from './DateSlider'
import AnimationController from './AnimationController'
import MainCounts from './MainCounts'
import LinePlot from './LinePlot'
import BubblePlot from './BubblePlot'
import NavBar from './NavBar'
import Loading from './Loading'
import Footer from './Footer'
import Region from './Region'
import Helmet from 'react-helmet'
import { ReactComponent as Icon } from '../covid19.svg'
import i18n from '../data/i18n.yml'
import * as str from '../utils/strings'

const defaultState = {
    currentMap: 'WORLD',
    metric: 'confirmedCount',
    currentRegion: [ str.GLOBAL_ZH ],
    playing: false,
    scale: 'log',
    mapZoom: 1
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
        ...defaultState
    }

    fetchData = () =>
        fetch('data/all.json').then((res) => res.json()).then((res) => {
            const latest = Object.keys(res[str.GLOBAL_ZH].confirmedCount).pop()
            this.setState({ data: res, dataLoaded: true, date: latest, tempDate: latest, endDate: latest })
            this.tooltipRebuild()
        })

    componentDidMount() {
        this.fetchData()
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

    regionToggle = (newRegion) => this.setState({ currentRegion: newRegion })

    playingToggle = () => this.setState({ playing: !this.state.playing })

    scaleToggle = () => this.setState({ scale: this.state.scale === 'linear' ? 'log' : 'linear' })

    languageToggle = () => this.setState({ lang: this.state.lang === 'en' ? 'zh' : 'en' })

    handleMapZoomChange = (newZoom) => this.setState({ mapZoom: newZoom })

    handleDateChange = (newDate) => this.setState({ date: newDate, tempDate: newDate })

    handleTempDateChange = (newDate) => this.setState({ tempDate: newDate })

    handleRegionChange = (newRegion) => {
        if (this.state.data == null) return
        if (this.state.currentMap === str.WORLD_MAP) {
            if (newRegion in this.state.data) this.setState({ currentRegion: [ newRegion ] })
        } else if (this.state.currentMap === str.CHINA_MAP1) {
            if ([ str.HONGKONG_ZH, str.MACAO_ZH, str.TAIWAN_ZH ].includes(newRegion)) {
                this.setState({
                    currentRegion: [ str.CHINA_ZH, newRegion ]
                })
            } else if (newRegion in this.state.data[str.CHINA_ZH][str.MAINLAND_CHINA_ZH]) {
                this.setState({
                    currentRegion: [ str.CHINA_ZH, str.MAINLAND_CHINA_ZH, newRegion ]
                })
            }
        } else if (this.state.currentMap === str.CHINA_MAP2) {
            if ([ str.HONGKONG_ZH, str.MACAO_ZH, str.TAIWAN_ZH ].includes(newRegion)) {
                this.setState({
                    currentRegion: [ str.CHINA_ZH, newRegion ]
                })
            } else {
                if ([ '北京市', '上海市', '天津市', '重庆市', '海南省' ].includes(newRegion)) {
                    this.setState({ currentRegion: [ str.CHINA_ZH, str.MAINLAND_CHINA_ZH, newRegion ] })
                } else {
                    Object.keys(this.state.data[str.CHINA_ZH][str.MAINLAND_CHINA_ZH]).forEach((province) => {
                        const provinceData = this.state.data[str.CHINA_ZH][str.MAINLAND_CHINA_ZH][province]
                        if (provinceData == null) return
                        if (Object.keys(provinceData).includes(newRegion)) {
                            this.setState({
                                currentRegion: [ str.CHINA_ZH, str.MAINLAND_CHINA_ZH, province, newRegion ]
                            })
                        }
                    })
                }
            }
        }
    }

    tooltipRebuild = () => ReactTooltip.rebuild()

    render() {
        const { lang, dataLoaded } = this.state

        return (
            <div className="App">
                <Helmet>
                    <title>{i18n.COVID19[lang]}</title>
                </Helmet>
                {!dataLoaded ? (
                    <Loading />
                ) : (
                    <Fragment>
                        <Container className="app-container">
                            <Row>
                                <Col lg="7">
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
                                        reset={this.reset}
                                    />
                                    <Map
                                        {...this.state}
                                        handleRegionChange={this.handleRegionChange}
                                        handleMapZoomChange={this.handleMapZoomChange}
                                        mapToggle={this.mapToggle}
                                        tooltipRebuild={this.tooltipRebuild}
                                    />
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
                                <Col lg="5">
                                    <Row style={{ display: 'flex', flexDirection: 'column', padding: 10 }}>
                                        <Region
                                            {...this.state}
                                            regionToggle={this.regionToggle}
                                            mapToggle={this.mapToggle}
                                            ReactTooltip={ReactTooltip}
                                        />
                                        <MainCounts {...this.state} />
                                        <LinePlot {...this.state} regionToggle={this.regionToggle} />
                                        <BubblePlot
                                            {...this.state}
                                            regionToggle={this.regionToggle}
                                            mapToggle={this.mapToggle}
                                        />
                                        <div className="footer-placeholder" />
                                    </Row>
                                </Col>
                            </Row>
                        </Container>
                        <Footer lang={lang} />
                    </Fragment>
                )}
                <ReactTooltip className="plot-tooltip" type="light" html={true} />
            </div>
        )
    }
}

export default App
