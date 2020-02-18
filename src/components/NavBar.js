import React, { Component } from 'react'
import { isMobile, isIPad13 } from 'react-device-detect'
import i18n from '../data/i18n.yml'

export default class NavBar extends Component {
    state = {
        langText: 'English',
        scaleText: i18n.LINEAR_SCALE.en
    }

    UNSAFE_componentWillReceiveProps(prevProps, prevState) {
        if (prevProps.scale !== this.props.scale || prevProps.lang !== this.props.lang) this.setTexts()
    }

    setTexts = () => {
        const { scale, lang } = this.props
        this.setState({
            langText: lang === 'en' ? 'English' : '中文',
            scaleText: scale === 'linear' ? i18n.LINEAR_SCALE[lang] : i18n.LOG_SCALE[lang]
        })
    }

    render() {
        const { scale, lang } = this.props
        return (
            <div className="nav-bar">
                {isMobile || isIPad13 ? (
                    <div className="nav-bar-icon" onTouchStart={this.props.languageToggle}>
                        {lang === 'en' ? 'English' : '中文'}
                    </div>
                ) : (
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
                )}
                {isMobile || isIPad13 ? (
                    <div className="nav-bar-icon" onTouchStart={this.props.scaleToggle}>
                        {scale === 'linear' ? i18n.LINEAR_SCALE[lang] : i18n.LOG_SCALE[lang]}
                    </div>
                ) : (
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
                )}
                <div className="nav-bar-icon" onClick={this.props.reset}>
                    {i18n.RESET[lang]}
                </div>
            </div>
        )
    }
}
