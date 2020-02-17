import React, { Component } from 'react'
import { Container, Row, Col } from 'reactstrap'
import TextTransition from 'react-text-transition'
import format from 'date-fns/format'
import zhCN from 'date-fns/locale/zh-CN'
import './App.css'
import Map from './Map'
import MapNavBar from './MapNavBar'
import DateSlider from './DateSlider'
import AnimationController from './AnimationController'
import MainCounts from './MainCounts'
import LinePlot from './LinePlot'
import BubblePlot from './BubblePlot'
import NavBar from './NavBar'
import i18n from '../data/i18n.yml'
import { parseDate, getDataFromRegion } from '../utils/utils'

const defaultState = {
    currentMap: 'WORLD',
    metric: 'confirmedCount',
    currentRegion: [ '全球' ], // Global
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
            const latest = Object.keys(res['全球'].confirmedCount).pop()
            this.setState({ data: res, dataLoaded: true, date: latest, tempDate: latest, endDate: latest })
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
            mapZoom: newMap === 'WORLD' || this.state.currentMap === 'WORLD' ? 1 : this.state.mapZoom
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
        if (this.state.currentMap === 'WORLD') {
            if (newRegion in this.state.data) this.setState({ currentRegion: [ newRegion ] })
        } else if (this.state.currentMap === 'CHN1') {
            if ([ '香港', '澳门', '台湾' ].includes(newRegion)) {
                this.setState({
                    currentRegion: [ '中国', newRegion ]
                })
            } else if (newRegion in this.state.data['中国']['中国大陆']) {
                this.setState({
                    currentRegion: [ '中国', '中国大陆', newRegion ]
                })
            }
        } else if (this.state.currentMap === 'CHN2') {
            if ([ '香港', '澳门', '台湾' ].includes(newRegion)) {
                this.setState({
                    currentRegion: [ '中国', newRegion ]
                })
            } else {
                if ([ '北京市', '上海市', '天津市', '重庆市', '海南省' ].includes(newRegion)) {
                    this.setState({ currentRegion: [ '中国', '中国大陆', newRegion ] })
                } else {
                    Object.keys(this.state.data['中国']['中国大陆']).forEach((province) => {
                        const provinceData = this.state.data['中国']['中国大陆'][province]
                        if (provinceData == null) return
                        console.log(Object.keys(provinceData))
                        if (Object.keys(provinceData).includes(newRegion)) {
                            this.setState({
                                currentRegion: [ '中国', '中国大陆', province, newRegion ]
                            })
                        }
                    })
                }
            }
        }
    }

    displayRegionName = () => {
        const { currentRegion, data } = this.state

        // remove duplicates in case same region occurs at different level (e.g. Japan)
        let region = [ ...new Set(currentRegion) ]

        if (this.state.lang === 'zh') {
            region = region.join('')
            region = region !== '中国' ? region.replace('中国', '') : '中国'
            return region !== '中国大陆' ? region.replace('中国大陆', '') : '中国大陆'
        } else {
            if (data == null) return
            const englishRegion = [ ...Array(region.length).keys() ]
                .map((i) => currentRegion.slice(0, i + 1))
                .map((regionList) => getDataFromRegion(data, regionList).ENGLISH)
            region = englishRegion.reverse().join(', ')
            region = region !== 'China' ? region.replace(', China', '') : 'China'
            return region !== 'Mainland China' ? region.replace(', Mainland China', '') : 'Mainland China'
        }
    }

    displayDate = () => {
        if (this.state.lang === 'zh') {
            return format(parseDate(this.state.date), 'yyyy年MMMd日', { locale: zhCN })
        } else {
            return format(parseDate(this.state.date), 'MMM d, yyyy')
        }
    }

    render() {
        const { lang } = this.state

        return (
            <div className="App">
                <Container>
                    <Row>
                        <Col sm="7">
                            <div className="header">
                                <h1>
                                    <TextTransition text={i18n.COVID19[lang]} />
                                </h1>
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
                        </Col>
                        <Col sm="5">
                            <Row style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="current-region-wrap">
                                    <div className="current-region">
                                        <TextTransition text={this.displayRegionName()} />
                                    </div>
                                    <div className="current-date">{this.displayDate()}</div>
                                </div>
                                <MainCounts {...this.state} />
                                <LinePlot {...this.state} />
                                <BubblePlot
                                    {...this.state}
                                    regionToggle={this.regionToggle}
                                    mapToggle={this.mapToggle}
                                />
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </div>
        )
    }
}

export default App
