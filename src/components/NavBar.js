import React, { Component } from 'react'
import i18n from '../data/i18n.yml'

export default class NavBar extends Component {
    state = {
        langText: '',
        scaleText: '',
        resetText: ''
    }

    componentDidMount() {
        this.setTexts()
    }

    UNSAFE_componentWillReceiveProps(prevProps, prevState) {
        if (prevProps.scale !== this.props.scale || prevProps.lang !== this.props.lang) this.setTexts()
    }

    setTexts = () => {
        const { scale, lang } = this.props
        this.setState({
            langText: lang === 'en' ? 'English' : '中文',
            scaleText: scale === 'linear' ? i18n.LINEAR_SCALE[lang] : i18n.LOG_SCALE[lang],
            resetText: i18n.RESET[lang]
        })
    }

    render() {
        const { scale, lang } = this.props
        return (
            <div className="nav-bar">
                <div
                    className="nav-bar-icon"
                    onClick={this.props.languageToggle}
                    onMouseEnter={() =>
                        this.setState({
                            langText: lang === 'en' ? '中文' : 'English'
                        })}
                    onMouseLeave={this.setTexts}
                >
                    {this.state.langText}
                </div>
                <div
                    className="nav-bar-icon"
                    onClick={this.props.scaleToggle}
                    onMouseEnter={() =>
                        this.setState({
                            scaleText: scale === 'linear' ? i18n.LOG_SCALE[lang] : i18n.LINEAR_SCALE[lang]
                        })}
                    onMouseLeave={this.setTexts}
                >
                    {this.state.scaleText}
                </div>
                <div className="nav-bar-icon" onClick={this.props.reset}>
                    {this.state.resetText}
                </div>
            </div>
        )
    }
}
