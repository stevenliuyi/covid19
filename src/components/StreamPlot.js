import React, { Component } from 'react'
import { ResponsiveStream } from '@nivo/stream'

export default class StreamPlot extends Component {
    render() {
        const { darkMode, plotParameters, plotDataAll, plotTheme, offsetType, fullPlot } = this.props

        if (plotParameters.type !== 'stream') return <div />

        return (
            <ResponsiveStream
                data={plotDataAll.plotData}
                keys={plotDataAll.plotKeys}
                theme={plotTheme}
                margin={{ top: 20, right: 115, bottom: 35, left: 40 }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    orient: 'bottom',
                    tickSize: 0,
                    tickPadding: 5,
                    tickRotation: !fullPlot ? 0 : -30,
                    format: (idx) => {
                        const n = !fullPlot ? 5 : 10
                        return plotParameters.xAxisFormat(
                            idx,
                            Math.round(plotDataAll.plotData.length / n),
                            plotDataAll.dates
                        )
                    }
                }}
                axisLeft={{
                    orient: 'left',
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    tickValues: 5,
                    format: offsetType !== 'expand' ? plotParameters.yAxisFormat : '.0%'
                }}
                offsetType={offsetType}
                colors={(d) =>
                    darkMode
                        ? [ 0, 1, 2, 3, 4, 5 ].map((x) => `var(--primary-color-${x})`)[
                              plotDataAll.plotKeys.length - 1 - d.index
                          ]
                        : [ 8, 6, 5, 4, 3, 2 ].map((x) => `var(--primary-color-${x})`)[
                              plotDataAll.plotKeys.length - 1 - d.index
                          ]}
                fillOpacity={0.85}
                animate={false}
                enableGridX={false}
                enableGridY={true}
                legends={plotParameters.legends}
                isInteractive={true}
                enableStackTooltip={true}
                tooltipFormat={(x) => <b>{x.value}</b>}
            />
        )
    }
}
