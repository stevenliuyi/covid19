import React, { Component } from 'react'
import { ResponsiveBump } from '@nivo/bump'
import { isMobile, isIPad13 } from 'react-device-detect'
import * as str from '../utils/strings'

export default class BumpPlot extends Component {
    render() {
        const { currentRegion, plotParameters, plotDataAll, plotTheme } = this.props

        if (plotParameters.type !== 'bump') return <div />

        return (
            <ResponsiveBump
                data={plotDataAll.plotData}
                theme={plotTheme}
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
                    if (isMobile || isIPad13) return
                    this.props.regionToggle(
                        currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH
                            ? [ serie.name ]
                            : [ ...currentRegion, serie.name ]
                    )
                }}
                tooltip={plotParameters.tooltip}
            />
        )
    }
}
