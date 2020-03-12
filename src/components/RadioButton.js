import React, { Component } from 'react'
import { Button, ButtonGroup } from 'reactstrap'

export default class RadioButton extends Component {
    render() {
        const { title, texts, selected, onSelect, alwaysShow, disabled } = this.props

        return (
            <div
                className={`plot-nav-bar-btn ${disabled ? 'grey-out' : ''}`}
                style={alwaysShow ? { display: 'flex' } : {}}
            >
                <div className="plot-nav-bar-btn-title">{title}</div>
                <ButtonGroup>
                    {Object.keys(texts).map((x) => (
                        <Button
                            className="radio-btn"
                            key={x}
                            color="secondary"
                            onClick={() => onSelect(x)}
                            active={selected === x}
                        >
                            {texts[x]}
                        </Button>
                    ))}
                </ButtonGroup>
            </div>
        )
    }
}
