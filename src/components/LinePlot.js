import React, { Component } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { MdArrowDropDownCircle } from 'react-icons/md'
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { parseDate, metricText, getDataFromRegion } from '../utils/utils'
import i18n from '../data/i18n.yml'

const metricColors = {
    confirmedCount: 'var(--primary-color-4)',
    deadCount: 'var(--primary-color-5)',
    curedCount: 'var(--primary-color-7)'
}

const plotTexts = {
    total: i18n.TOTAL_CASES,
    new: i18n.NEW_CASES
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

        const logTickMin = minValue <= maxValue ? Math.max(10 ** Math.floor(Math.log10(minValue)), 1) : 1
        const logTickMax = minValue <= maxValue ? Math.max(10 ** Math.ceil(Math.log10(maxValue)), 10) : 1
        const ticks = [ ...Array(Math.log10(logTickMax / logTickMin) + 1).keys() ].map((x) => 10 ** x * logTickMin)

        if (this.state.plotType === 'new') {
            plotData.forEach((metricData) => {
                metricData.data = metricData.data.reduce(
                    (s, v, i) => [ ...s, metricData.data[i - 1] ? { ...v, y: v.y - metricData.data[i - 1].y } : v ],
                    []
                )
            })
            minValue = Math.min(...plotData.map((metricData) => Math.min(...metricData.data.map((d) => d.y))))
            minValue = Math.min(...plotData.map((metricData) => Math.min(...metricData.data.map((d) => d.y))))
        }

        let tickValues = scale === 'linear' || this.state.plotType === 'new' ? 5 : ticks

        const isDataEmpty = plotData.map((d) => d.data.length).reduce((s, x) => s + x, 0) === 0
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
                        <span>{plotTexts[this.state.plotType][lang]}</span>
                        <MdArrowDropDownCircle size={20} className="line-plot-dropdown" />
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem
                            className={this.state.plotType === 'total' ? 'current' : ''}
                            onClick={() =>
                                this.setState({
                                    plotType: 'total',
                                    dropdownOpen: !this.state.dropdownOpen
                                })}
                        >
                            {plotTexts['total'][lang]}
                        </DropdownItem>
                        <DropdownItem
                            className={this.state.plotType === 'new' ? 'current' : ''}
                            onClick={() =>
                                this.setState({
                                    plotType: 'new',
                                    dropdownOpen: !this.state.dropdownOpen
                                })}
                        >
                            {plotTexts['new'][lang]}
                        </DropdownItem>
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
                    <ResponsiveLine
                        margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
                        theme={{ fontFamily: 'Saira, sans-serif' }}
                        animate={true}
                        data={plotData}
                        colors={[ 'var(--primary-color-6)', 'var(--primary-color-8)', 'var(--primary-color-4)' ]}
                        xScale={{
                            type: 'time',
                            format: '%Y-%m-%d',
                            precision: 'day',
                            useUTC: false
                        }}
                        xFormat="time:%Y-%m-%d"
                        yScale={
                            scale === 'linear' || this.state.plotType === 'new' ? (
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
                            format: (e) => (parseInt(e, 10) !== e ? '' : e < 1000 ? e : `${e / 1000}k`),
                            tickSize: 0,
                            tickValues: tickValues
                        }}
                        axisBottom={{
                            orient: 'bottom',
                            format: '%-m/%-d',
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
                                itemWidth: 100,
                                itemHeight: 20,
                                itemOpacity: 0.75,
                                symbolSize: 12,
                                symbolShape: 'circle',
                                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                                effects: []
                            }
                        ]}
                    />
                </div>
            </div>
        )
    }
}
