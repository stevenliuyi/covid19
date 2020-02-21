import React, { Component, Fragment } from 'react'
import { MdKeyboardArrowRight } from 'react-icons/md'

export default class RegionSelectOption extends Component {
    render() {
        const { region, data, date, metric } = this.props
        return (
            <div className="region-option">
                <div>
                    {region.map(
                        (x, i) =>
                            i === region.length - 1 ? (
                                <span key={`region-${region[region.length - 1]}-${i}`}>{x}</span>
                            ) : (
                                <Fragment key={`region-${region[region.length - 1]}-${i}`}>
                                    <span>{x}</span>
                                    <MdKeyboardArrowRight size={14} color={'#ccc'} />
                                </Fragment>
                            )
                    )}
                </div>
                <div className="region-option-count">{data[metric] && data[metric][date] ? data[metric][date] : 0}</div>
            </div>
        )
    }
}
