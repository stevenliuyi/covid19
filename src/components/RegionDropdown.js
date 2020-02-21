import React from 'react'

const RegionDropdown = ({ children, isOpen, target, onClose }) => (
    <div style={{ position: 'relative' }}>
        {target}
        {isOpen ? <div className="region-menu">{children}</div> : null}
        {isOpen ? <div className="region-blanket" onClick={onClose} /> : null}
    </div>
)

export default RegionDropdown
