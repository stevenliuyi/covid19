import React, { Component } from 'react'
import BubblePlot from './BubblePlot'
import Table from './Table'
import RadioButton from './RadioButton'
import i18n from '../data/i18n.yml'

export default class Tree extends Component {
    state = {
        height: 280,
        type: 'bubble'
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

    render() {
        const { fullPlot, lang } = this.props
        if (fullPlot) return <div />
        return (
            <div className="tree-wrap" style={{ height: this.state.height }}>
                <div className="bubble-table-toggle-btn">
                    <RadioButton
                        texts={{ bubble: i18n.BUBBLES[lang], table: i18n.TABLE[lang] }}
                        selected={this.state.type}
                        onSelect={(s) => this.setState({ type: s })}
                        alwaysShow={true}
                    />
                </div>
                {this.state.type === 'bubble' && <BubblePlot {...this.props} />}
                {this.state.type === 'table' && <Table {...this.props} />}
            </div>
        )
    }
}
