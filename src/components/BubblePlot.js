import React, { Component } from 'react'
import { ResponsiveBubble } from '@nivo/circle-packing'
import { interpolateMagma } from 'd3-scale-chromatic'
import { getDataFromRegion } from '../utils/utils'
import * as str from '../utils/strings'

export default class BubblePlot extends Component {
    state = {
        plotData: null,
        currentNodePath: null,
        height: 280
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
            height: vh < 850 && vw >= 992 ? 240 : 280
        })
    }

    generate = (obj) => {
        const { date, lang } = this.props
        return Object.entries(obj)
            .filter(
                ([ k, v ]) => ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH', str.GLOBAL_ZH ].includes(k)
            )
            .map(([ k, v ]) => {
                let newdata = {
                    name: k,
                    displayName: lang === 'zh' ? k : v.ENGLISH,
                    confirmedCount: v.confirmedCount && v.confirmedCount[date] ? v.confirmedCount[date] : 0,
                    deadCount: v.deadCount && v.deadCount[date] ? v.deadCount[date] : 0,
                    curedCount: v.curedCount && v.curedCount[date] ? v.curedCount[date] : 0
                }

                if (Object.keys(v).length > 4) {
                    newdata.children = this.generate(v)
                }
                return newdata
            })
    }

    // hack so that bubble plot can interact with other plots
    handleNodeClick = (node) => {
        const region = node.path === str.GLOBAL_ZH ? [ node.path ] : node.path.split('.').reverse().slice(1)
        this.props.regionToggle(region)
    }

    render() {
        const { data, metric, currentRegion, date, playing, lang } = this.props
        if (data == null) return <div />
        const plotData = {
            name: str.GLOBAL_ZH,
            displayName: lang === 'en' ? str.GLOBAL_EN : str.GLOBAL_ZH,
            confirmedCount: data[str.GLOBAL_ZH].confirmedCount[date],
            deadCount: data[str.GLOBAL_ZH].deadCount[date],
            curedCount: data[str.GLOBAL_ZH].curedCount[date],
            children: this.generate(data)
        }
        let currentNodePath =
            currentRegion[0] === str.GLOBAL_ZH ? str.GLOBAL_ZH : [ str.GLOBAL_ZH, ...currentRegion ].reverse().join('.')

        // TODO: Node does not exist when count is 0. Need to find the parent node that has non-zero count.
        const currentData = getDataFromRegion(data, currentRegion)
        const count = currentData[metric][date]
        if (count == null || count === 0)
            currentNodePath = [ str.GLOBAL_ZH, ...currentRegion.slice(0, currentRegion.length - 1) ].reverse().join('.')

        const displayNodePath =
            Object.keys(currentData).length > 4
                ? currentNodePath
                : currentRegion[0] === str.GLOBAL_ZH
                  ? str.GLOBAL_ZH
                  : [ str.GLOBAL_ZH, ...currentRegion.slice(0, currentRegion.length - 1) ].reverse().join('.')

        return (
            <div style={{ height: this.state.height, width: '100%' }}>
                <ResponsiveBubble
                    ref={this.bubble}
                    root={plotData}
                    theme={{ fontFamily: 'Saira, sans-serif' }}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    tooltip={({ color, value, data }) => (
                        <span className="plot-tooltip" style={{ color: color === '#fff' ? '#222' : color }}>
                            {data.displayName}
                            <span className="plot-tooltip-bold">{` ${data[metric]}`}</span>
                        </span>
                    )}
                    identity="name"
                    value={metric}
                    colors={[ ...[ 0.3, 0.4, 0.2, 0.1 ].map((x) => interpolateMagma(1 - x)), '#fff' ]}
                    padding={4}
                    enableLabel={true}
                    label={({ data }) => data.displayName}
                    labelTextColor={'#222'}
                    labelSkipRadius={8}
                    animate={!playing}
                    motionStiffness={50}
                    motionDamping={12}
                    onClick={this.handleNodeClick}
                    defs={[
                        {
                            id: 'bubbleLines',
                            type: 'patternLines',
                            background: 'none',
                            color: 'inherit',
                            rotation: -45,
                            lineWidth: 4,
                            spacing: 5
                        }
                    ]}
                    fill={[
                        {
                            match: (d) => d.path === currentNodePath,
                            id: 'bubbleLines'
                        }
                    ]}
                    currentNodePath={displayNodePath}
                />
            </div>
        )
    }
}
