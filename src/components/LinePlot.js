import React, { Component } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { parseDate, metricText, getDataFromRegion } from '../utils/utils'

const metricColors = {
    confirmedCount: 'var(--primary-color-4)',
    deadCount: 'var(--primary-color-5)',
    curedCount: 'var(--primary-color-7)'
}

export default class LinePlot extends Component {
    state = {
        height: 300
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
            height: vh < 850 && vw >= 992 ? 250 : 300
        })
    }

    render() {
        const { data, currentRegion, playing, date, tempDate, endDate, startDate, scale, lang } = this.props
        if (data == null) return <div />

        let maxValue = 0
        let minValue = 100000
        const plotData = [ 'confirmedCount', 'deadCount', 'curedCount' ].map((metric) => {
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

        return (
            <div style={{ height: this.state.height, width: '100%' }}>
                <ResponsiveLine
                    margin={{ top: 20, right: 20, bottom: 60, left: 45 }}
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
                        scale === 'linear' ? (
                            {
                                type: 'linear',
                                max: 'auto',
                                min: 0
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
                        tickSize: 0,
                        tickValues: scale === 'linear' ? 5 : ticks
                    }}
                    axisBottom={{
                        orient: 'bottom',
                        format: '%-m/%-d',
                        tickValues: 5
                    }}
                    enableGridX={false}
                    gridYValues={scale === 'linear' ? 5 : ticks}
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
        )
    }
}
