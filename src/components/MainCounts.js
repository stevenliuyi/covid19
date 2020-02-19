import React, { Component } from 'react'
import { metricText, getDataFromRegion } from '../utils/utils'

export default class MainCounts extends Component {
    render() {
        const { data, currentRegion, date, lang } = this.props
        if (data == null) return <div />

        return (
            <div className="counts-wrap">
                {[ 'confirmedCount', 'deadCount', 'curedCount' ].map((metric) => {
                    const count = getDataFromRegion(data, currentRegion)[metric][date]
                    return (
                        <div key={`${metric}-number`} className="count-wrap">
                            <div className="count">{count ? count : 0}</div>
                            <div className="count-title">{metricText[metric][lang]}</div>
                        </div>
                    )
                })}
            </div>
        )
    }
}
