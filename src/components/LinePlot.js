import React, { Component } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ResponsiveBump } from '@nivo/bump'
import { ResponsiveStream } from '@nivo/stream'
import { MdArrowDropDownCircle } from 'react-icons/md'
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { isMobile, isIPad13 } from 'react-device-detect'
import format from 'date-fns/format'
import { parseDate, metricText, getDataFromRegion, simplifyName } from '../utils/utils'
import * as str from '../utils/strings'
import i18n from '../data/i18n.yml'

const metricColors = {
    confirmedCount: 'var(--primary-color-6)',
    deadCount: 'var(--primary-color-8)',
    curedCount: 'var(--primary-color-4)'
}

const integerFormat = (e) => (parseInt(e, 10) !== e ? '' : Math.abs(e) < 1000 ? e : `${e / 1000}k`)
const absIntegerFormat = (e) =>
    parseInt(e, 10) !== e ? '' : Math.abs(e) < 1000 ? Math.abs(e) : `${Math.abs(e) / 1000}k`
const streamTimeFormat = (idx, interval, dates) => (idx % interval === 0 ? format(parseDate(dates[idx]), 'M/d') : '')

const plotTypes = {
    total: {
        type: 'line',
        text: i18n.TOTAL_CASES,
        axisFormat: integerFormat,
        timeAxisFormat: '%-m/%-d',
        log: true,
        legendItemWidth: 100
    },
    new: {
        type: 'line',
        text: i18n.NEW_CASES,
        axisFormat: integerFormat,
        timeAxisFormat: '%-m/%-d',
        log: false,
        legendItemWidth: 100
    },
    fatality_recovery: {
        type: 'line',
        text: i18n.FATALITY_RECOVERY_RATE,
        axisFormat: '.2%',
        timeAxisFormat: '%-m/%-d',
        format: '.2%',
        log: false,
        legendItemWidth: 150
    },
    one_vs_rest: {
        type: 'line',
        text: i18n.ONE_VS_REST,
        axisFormat: integerFormat,
        timeAxisFormat: '%-m/%-d',
        log: true,
        legendItemWidth: 150
    },
    most_affected_subregions: {
        type: 'bump',
        text: i18n.MOST_AFFECTED_SUBREGIONS,
        log: false
    },
    remaining_confirmed: {
        type: 'stream',
        text: i18n.REMAINING_CONFIRMED_CASES,
        axisFormat: absIntegerFormat,
        timeAxisFormat: streamTimeFormat,
        log: false
    }
}

export default class LinePlot extends Component {
    state = {
        height: 290,
        dropdownOpen: false,
        plotType: 'total'
    }

    componentDidMount() {
        this.updateHight()
        window.addEventListener('resize', this.updateHight)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateHight)
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            this.props.currentRegion.length === 1 &&
            this.props.currentRegion[0] === str.GLOBAL_ZH &&
            this.state.plotType === 'one_vs_rest'
        )
            this.setState({
                plotType: 'total'
            })

        if (
            Object.keys(getDataFromRegion(this.props.data, this.props.currentRegion)).length === 4 &&
            (this.props.currentRegion.length !== 1 || this.props.currentRegion[0] !== str.GLOBAL_ZH) &&
            this.state.plotType === 'most_affected_subregions'
        )
            this.setState({
                plotType: 'total'
            })
    }

    updateHight = () => {
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)

        this.setState({
            height: vh < 850 && vw >= 992 ? 240 : 290
        })
    }

    render() {
        const { data, currentRegion, playing, date, tempDate, endDate, startDate, scale, lang } = this.props
        if (data == null) return <div />

        let maxValue = 0
        let minValue = 100000
        let plotData = [ 'confirmedCount', 'deadCount', 'curedCount' ].map((metric) => {
            const counts = getDataFromRegion(data, currentRegion)[metric]
            return {
                id: metricText[metric][lang],
                color: metricColors[metric],
                data: Object.keys(counts)
                    .filter((d) => !playing || parseDate(d) <= parseDate(date))
                    .map((d) => {
                        if (counts[d] > maxValue) maxValue = counts[d]
                        if (counts[d] < minValue) minValue = counts[d]

                        return scale === 'linear' || counts[d] > 0
                            ? {
                                  x: d,
                                  y: counts[d]
                              }
                            : null
                    })
                    .filter((x) => x != null)
            }
        })
        let plotKeys = []
        let dates = []

        if (this.state.plotType === 'new') {
            plotData.forEach((metricData) => {
                metricData.data = metricData.data.reduce(
                    (s, v, i) => [ ...s, metricData.data[i - 1] ? { ...v, y: v.y - metricData.data[i - 1].y } : v ],
                    []
                )
            })
        } else if (this.state.plotType === 'fatality_recovery') {
            const confirmedCounts = getDataFromRegion(data, currentRegion)['confirmedCount']

            plotData = [ 'deadCount', 'curedCount' ].map((metric) => {
                const counts = getDataFromRegion(data, currentRegion)[metric]
                const newMetric = metric === 'deadCount' ? 'fatalityRate' : 'recoveryRate'
                return {
                    id: metricText[newMetric][lang],
                    color: metricColors[metric],
                    data: Object.keys(counts)
                        .filter((d) => !playing || parseDate(d) <= parseDate(date))
                        .map((d) => ({ d, count: confirmedCounts[d] > 0 ? counts[d] / confirmedCounts[d] : 0 }))
                        .map(({ d, count }) => {
                            return {
                                x: d,
                                y: count
                            }
                        })
                }
            })
        } else if (this.state.plotType === 'one_vs_rest') {
            maxValue = 0
            minValue = 100000
            const metric = this.props.metric

            const currentData = getDataFromRegion(data, currentRegion)
            const counts = currentData[metric]
            let regionName = lang === 'zh' ? currentRegion[currentRegion.length - 1] : currentData.ENGLISH
            regionName = simplifyName(regionName, lang)

            const parentRegion =
                currentRegion.length === 1 ? [ str.GLOBAL_ZH ] : currentRegion.slice(0, currentRegion.length - 1)
            const parentData = getDataFromRegion(data, parentRegion)
            const parentCounts = parentData[metric]
            let parentRegionName = lang === 'zh' ? parentRegion[parentRegion.length - 1] : parentData.ENGLISH
            parentRegionName = simplifyName(parentRegionName, lang)

            plotData = []

            plotData.push({
                id:
                    lang === 'zh'
                        ? `${parentRegionName} (${i18n.REST[lang]})`
                        : `${i18n.REST[lang]} of ${parentRegionName}`,
                color: 'var(--primary-color-6)',
                data: Object.keys(parentCounts)
                    .filter((d) => !playing || parseDate(d) <= parseDate(date))
                    .map((d) => {
                        if (counts[d] == null) return null

                        if (parentCounts[d] - counts[d] > maxValue) maxValue = parentCounts[d] - counts[d]
                        if (parentCounts[d] - counts[d] < minValue) minValue = parentCounts[d] - counts[d]

                        return scale === 'linear' || parentCounts[d] - counts[d] > 0
                            ? {
                                  x: d,
                                  y: parentCounts[d] - counts[d]
                              }
                            : null
                    })
                    .filter((x) => x != null)
            })

            plotData.push({
                id: regionName,
                color: 'var(--primary-color-4)',
                data: Object.keys(counts)
                    .filter((d) => !playing || parseDate(d) <= parseDate(date))
                    .map((d) => {
                        if (parentCounts[d] == null) return null

                        if (counts[d] > maxValue) maxValue = counts[d]
                        if (counts[d] < minValue) minValue = counts[d]

                        return scale === 'linear' || counts[d] > 0
                            ? {
                                  x: d,
                                  y: counts[d]
                              }
                            : null
                    })
                    .filter((x) => x != null)
            })
        } else if (this.state.plotType === 'most_affected_subregions') {
            const metric = this.props.metric
            const currentData =
                currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH
                    ? data
                    : getDataFromRegion(data, currentRegion)

            let regionIndices = {}
            plotData = Object.keys(currentData)
                .filter(
                    (region) =>
                        ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH', str.GLOBAL_ZH ].includes(region)
                )
                .sort((a, b) => {
                    const aCounts = Math.max(...Object.values(currentData[a][metric]))
                    const bCounts = Math.max(...Object.values(currentData[b][metric]))
                    return aCounts <= bCounts ? 1 : -1
                })
                // top 10 affected subregions
                .filter((region, i) => i <= 9 && Math.max(...Object.values(currentData[region][metric])) !== 0)
                .map((region, i) => {
                    dates = [ ...dates, ...Object.keys(currentData[region][metric]) ]
                    dates = [ ...new Set(dates) ]
                    regionIndices[region] = i
                    return region
                })
                .map((region, i) => {
                    const id = lang === 'zh' ? region : currentData[region].ENGLISH
                    const counts = Object.values(currentData[region][metric])
                    return {
                        id: simplifyName(id, lang),
                        fullId: id,
                        name: region,
                        color: `var(--primary-color-${10 - i})`,
                        count: counts[counts.length - 1],
                        data: []
                    }
                })

            dates = dates.sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))

            let regionSkipped = {}
            dates.filter((d) => !playing || parseDate(d) <= parseDate(date)).forEach((d) => {
                let regionCounts = []
                plotData.forEach((region) => {
                    regionCounts.push({
                        region: region.name,
                        counts: currentData[region.name][metric][d] ? currentData[region.name][metric][d] : 0
                    })
                })
                regionCounts = regionCounts.sort((a, b) => (a.counts <= b.counts ? 1 : -1))

                regionCounts.forEach((region, i) => {
                    if (region.counts === 0 && regionSkipped[region.region] == null) {
                        plotData[regionIndices[region.region]].data.push({
                            x: d,
                            y: null
                        })
                    } else {
                        regionSkipped[region.region] = true
                        plotData[regionIndices[region.region]].data.push({
                            x: d,
                            y: i + 1
                        })
                    }
                })
            })
        } else if (this.state.plotType === 'remaining_confirmed') {
            const currentData =
                currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH
                    ? data
                    : getDataFromRegion(data, currentRegion)

            let subregionsData = Object.keys(currentData)
                .filter(
                    (region) =>
                        ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH', str.GLOBAL_ZH ].includes(region)
                )
                .sort((a, b) => {
                    const aCounts = Math.max(...Object.values(currentData[a]['confirmedCount']))
                    const bCounts = Math.max(...Object.values(currentData[b]['confirmedCount']))
                    return aCounts <= bCounts ? 1 : -1
                })
                // top 5 affected subregions
                .filter(
                    (region, i) => i <= 4 && Math.max(...Object.values(currentData[region]['confirmedCount'])) !== 0
                )
                .map((region, i) => {
                    dates = [ ...dates, ...Object.keys(currentData[region]['confirmedCount']) ]
                    dates = [ ...new Set(dates) ]
                    return region
                })
                .map((region, i) => {
                    const id = lang === 'zh' ? region : currentData[region].ENGLISH
                    return {
                        id: simplifyName(id, lang),
                        fullId: id,
                        name: region
                    }
                })

            plotData = []
            plotKeys = subregionsData.map((x) => x.id)
            // at least 6 subregions
            if (Object.keys(currentData).length >= 10) plotKeys = [ ...plotKeys, i18n.OTHERS[lang] ]
            plotKeys = plotKeys.reverse()

            dates = dates.sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))

            // no subregions
            if (subregionsData.length === 0) {
                dates = Object.keys(currentData['confirmedCount'])
                let id = lang === 'zh' ? currentRegion[currentRegion.length - 1] : currentData.ENGLISH
                id = simplifyName(id, lang)
                plotKeys = [ id ]
            }

            dates.filter((d) => !playing || parseDate(d) <= parseDate(date)).forEach((d) => {
                let subregionCounts = {}
                subregionsData.forEach((region) => {
                    const confirmedCount = currentData[region.name]['confirmedCount'][d]
                        ? currentData[region.name]['confirmedCount'][d]
                        : 0
                    const deadCount = currentData[region.name]['deadCount'][d]
                        ? currentData[region.name]['deadCount'][d]
                        : 0
                    const curedCount = currentData[region.name]['curedCount'][d]
                        ? currentData[region.name]['curedCount'][d]
                        : 0
                    const remainingConfirmed = Math.max(confirmedCount - deadCount - curedCount, 0)
                    subregionCounts[region.id] = remainingConfirmed
                })

                let otherConfirmedCount = 0
                let otherDeadCount = 0
                let otherCuredCount = 0

                // compute number of remaining confirmed cases from non-top-5 subregions
                Object.keys(currentData)
                    .filter(
                        (region) =>
                            ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH', str.GLOBAL_ZH ].includes(region)
                    )
                    .filter((region) => !subregionsData.map((x) => x.name).includes(region))
                    .forEach((region) => {
                        const confirmedCount = currentData[region]['confirmedCount'][d]
                            ? currentData[region]['confirmedCount'][d]
                            : 0
                        const deadCount = currentData[region]['deadCount'][d] ? currentData[region]['deadCount'][d] : 0
                        const curedCount = currentData[region]['curedCount'][d]
                            ? currentData[region]['curedCount'][d]
                            : 0
                        otherConfirmedCount += confirmedCount
                        otherDeadCount += deadCount
                        otherCuredCount += curedCount
                    })
                const otherRemainingConfirmed = Math.max(otherConfirmedCount - otherDeadCount - otherCuredCount, 0)
                if (Object.keys(currentData).length >= 10) subregionCounts[i18n.OTHERS[lang]] = otherRemainingConfirmed

                // no subregions
                if (subregionsData.length === 0) {
                    const confirmedCount = currentData['confirmedCount'][d] ? currentData['confirmedCount'][d] : 0
                    const deadCount = currentData['deadCount'][d] ? currentData['deadCount'][d] : 0
                    const curedCount = currentData['curedCount'][d] ? currentData['curedCount'][d] : 0
                    const remainingConfirmed = Math.max(confirmedCount - deadCount - curedCount, 0)
                    let id = lang === 'zh' ? currentRegion[currentRegion.length - 1] : currentData.ENGLISH
                    id = simplifyName(id, lang)
                    subregionCounts[id] = remainingConfirmed
                }
                plotData.push(subregionCounts)
            })
        }

        let tickValues = 5
        let logTickMin = 1
        let logTickMax = 1

        if (scale === 'log' && plotTypes[this.state.plotType].log) {
            logTickMin = minValue <= maxValue ? Math.max(10 ** Math.floor(Math.log10(minValue)), 1) : 1
            logTickMax = minValue <= maxValue ? Math.max(10 ** Math.ceil(Math.log10(maxValue)), 10) : 1
            tickValues = [ ...Array(Math.log10(logTickMax / logTickMin) + 1).keys() ].map((x) => 10 ** x * logTickMin)
        }

        const isDataEmpty =
            this.state.plotType !== 'remaining_confirmed'
                ? plotData.map((d) => d.data.length).reduce((s, x) => s + x, 0) === 0
                : plotData.map((d) => Object.keys(d).length).reduce((s, x) => s + x, 0) === 0

        if (isDataEmpty) tickValues = 0

        return (
            <div style={{ width: '100%' }}>
                <UncontrolledDropdown className="">
                    <DropdownToggle
                        tag="span"
                        className="line-plot-title"
                        data-toggle="dropdown"
                        aria-expanded={this.state.dropdownOpen}
                    >
                        <span>{plotTypes[this.state.plotType].text[lang]}</span>
                        <MdArrowDropDownCircle size={20} className="dropdown-arrow" />
                    </DropdownToggle>
                    <DropdownMenu>
                        {Object.keys(plotTypes).map(
                            (plotType) =>
                                // no One-vs-Rest comparison plot when current region is Global
                                plotType === 'one_vs_rest' &&
                                currentRegion.length === 1 &&
                                currentRegion[0] === str.GLOBAL_ZH ? (
                                    <div key={`dropdown-${plotType}`} />
                                ) : plotType === 'most_affected_subregions' &&
                                (Object.keys(getDataFromRegion(this.props.data, currentRegion)).length === 4 &&
                                    (currentRegion.length !== 1 || currentRegion[0] !== str.GLOBAL_ZH)) ? (
                                    <div key={`dropdown-${plotType}`} />
                                ) : (
                                    <DropdownItem
                                        key={`dropdown-${plotType}`}
                                        className={this.state.plotType === plotType ? 'current' : ''}
                                        onClick={() =>
                                            this.setState({
                                                plotType,
                                                dropdownOpen: !this.state.dropdownOpen
                                            })}
                                    >
                                        {plotTypes[plotType].text[lang]}
                                    </DropdownItem>
                                )
                        )}
                    </DropdownMenu>
                </UncontrolledDropdown>
                <div style={{ height: this.state.height, width: '100%' }}>
                    {isDataEmpty ? (
                        <div className="plot-no-data">
                            <span>{i18n.NO_DATA[lang]}</span>
                        </div>
                    ) : (
                        <div />
                    )}
                    {plotTypes[this.state.plotType].type === 'line' && (
                        <ResponsiveLine
                            margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
                            theme={{ fontFamily: 'Saira, sans-serif' }}
                            animate={true}
                            data={plotData}
                            colors={(d) => d.color}
                            xScale={{
                                type: 'time',
                                format: '%Y-%m-%d',
                                precision: 'day',
                                useUTC: false
                            }}
                            xFormat="time:%Y-%m-%d"
                            yFormat={plotTypes[this.state.plotType].format}
                            yScale={
                                scale === 'linear' || !plotTypes[this.state.plotType].log ? (
                                    {
                                        type: 'linear',
                                        max: 'auto',
                                        min: 'auto'
                                    }
                                ) : (
                                    {
                                        type: 'log',
                                        min: logTickMin,
                                        max: logTickMax
                                    }
                                )
                            }
                            axisLeft={{
                                orient: 'left',
                                // do not show ticks with non-integer values
                                format: plotTypes[this.state.plotType].axisFormat,
                                tickSize: 0,
                                tickValues: tickValues
                            }}
                            axisBottom={{
                                orient: 'bottom',
                                format: plotTypes[this.state.plotType].timeAxisFormat,
                                tickValues: 5
                            }}
                            enableGridX={false}
                            gridYValues={tickValues}
                            pointSize={8}
                            pointBorderWidth={1}
                            pointBorderColor={'white'}
                            useMesh={true}
                            enableArea={false}
                            enableSlices={'x'}
                            curve={'monotoneX'}
                            markers={
                                !playing && tempDate !== startDate && tempDate !== endDate ? (
                                    [
                                        {
                                            axis: 'x',
                                            value: parseDate(tempDate),
                                            lineStyle: {
                                                stroke: 'var(--primary-color-5)',
                                                strokeWidth: 1,
                                                strokeDasharray: '6 6'
                                            }
                                        }
                                    ]
                                ) : (
                                    []
                                )
                            }
                            legends={[
                                {
                                    anchor: 'bottom',
                                    direction: 'row',
                                    justify: false,
                                    translateX: 0,
                                    translateY: 50,
                                    itemsSpacing: 10,
                                    itemDirection: 'left-to-right',
                                    itemWidth: plotTypes[this.state.plotType].legendItemWidth,
                                    itemHeight: 20,
                                    itemOpacity: 0.75,
                                    symbolSize: 12,
                                    symbolShape: 'circle',
                                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                                    effects: []
                                }
                            ]}
                        />
                    )}
                    {!isDataEmpty &&
                    plotTypes[this.state.plotType].type === 'bump' && (
                        <ResponsiveBump
                            data={plotData}
                            theme={{ fontFamily: 'Saira, sans-serif' }}
                            margin={{ top: 10, right: 100, bottom: 20, left: 50 }}
                            colors={(d) => d.color}
                            lineWidth={2}
                            activeLineWidth={4}
                            inactiveLineWidth={2}
                            inactiveOpacity={0.15}
                            pointSize={0}
                            activePointSize={0}
                            inactivePointSize={0}
                            pointBorderWidth={3}
                            activePointBorderWidth={3}
                            enableGridX={false}
                            enableGridY={false}
                            axisRight={null}
                            axisTop={null}
                            axisBottom={null}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0
                            }}
                            onClick={(serie) => {
                                // TODO: map may also needs to be changed
                                if (isMobile || isIPad13) return
                                this.props.regionToggle(
                                    currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH
                                        ? [ serie.name ]
                                        : [ ...currentRegion, serie.name ]
                                )
                            }}
                            tooltip={({ serie }) => (
                                <span className="plot-tooltip plot-tooltip-bump" style={{ color: serie.color }}>
                                    {serie.fullId}
                                    <span className="plot-tooltip-bold">{` ${serie.count}`}</span>
                                </span>
                            )}
                        />
                    )}
                    {!isDataEmpty &&
                    plotTypes[this.state.plotType].type === 'stream' && (
                        <ResponsiveStream
                            data={plotData}
                            keys={plotKeys}
                            theme={{ fontFamily: 'Saira, sans-serif' }}
                            margin={{ top: 20, right: 115, bottom: 35, left: 40 }}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                orient: 'bottom',
                                tickSize: 1,
                                tickPadding: 5,
                                tickRotation: 0,
                                format: (idx) =>
                                    plotTypes[this.state.plotType].timeAxisFormat(
                                        idx,
                                        Math.round(plotData.length / 5),
                                        dates
                                    )
                            }}
                            axisLeft={{
                                orient: 'left',
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                tickValues: 5,
                                format: plotTypes[this.state.plotType].axisFormat
                            }}
                            offsetType="silhouette"
                            colors={(d) =>
                                [ 8, 6, 5, 4, 3, 2 ].map((x) => `var(--primary-color-${x})`)[
                                    plotKeys.length - 1 - d.index
                                ]}
                            fillOpacity={0.85}
                            animate={false}
                            enableGridX={false}
                            enableGridY={true}
                            legends={[
                                {
                                    anchor: 'right',
                                    direction: 'column',
                                    translateX: 100,
                                    itemWidth: 90,
                                    itemHeight: 20,
                                    itemTextColor: '#000',
                                    symbolSize: 12,
                                    symbolShape: 'circle'
                                }
                            ]}
                            isInteractive={true}
                            enableStackTooltip={true}
                            tooltipFormat={(x) => <b>{x.value}</b>}
                        />
                    )}
                </div>
            </div>
        )
    }
}
