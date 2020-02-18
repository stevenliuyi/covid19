import React, { Component } from 'react'
import { ReactComponent as Icon } from '../covid19.svg'

export default class Loading extends Component {
    render() {
        return (
            <div className="loading-icon">
                <Icon />
            </div>
        )
    }
}
