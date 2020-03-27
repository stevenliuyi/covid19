import React, { Component } from 'react'
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from 'react-icons/ai'
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
        const { fullPlot, fullTree, fullTreeToggle, fullDimensions, lang } = this.props
        if (fullPlot) return <div />

        const FullScreenIcon = fullTree ? AiOutlineFullscreenExit : AiOutlineFullscreen
        return (
            <div
                className="tree-wrap"
                style={{
                    height: !fullTree ? this.state.height : fullDimensions.height - 100,
                    width: !fullTree ? '100%' : fullDimensions.width + 100
                }}
            >
                <div className="tree-full-button">
                    <FullScreenIcon size={fullTree ? 30 : 20} onClick={fullTreeToggle} />
                </div>
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
