/*
 * Drop down button that starts with a default but updates to take a value.
 */
import React, { CSSProperties } from 'react';

import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

interface LabeledDropdownButton {
    id?: string;
    initialLabel: string;
    onClick: (value: string) => void;
    style?: CSSProperties;
    variant?: string;
    options: string[];
    optionStyle?: CSSProperties;
};


export default function LabeledDropdownButton(props: LabeledDropdownButton) {
    let { id, initialLabel, onClick, options, optionStyle, style, variant } = props;
    const [currentLabel, setCurrentLabel] = React.useState(initialLabel);
    id ||= initialLabel.replace(/\s+/g, '-').toLowerCase(); // Replace spaces with hyphens and convert to lowercase
    variant ||= "info";

    const selectOption = (value: string) => {
        setCurrentLabel(value);
        onClick(value);
    };

    return (
        <DropdownButton id={id} title={currentLabel} style={style || {}} variant={variant}>
            {options.map((value) => (
                <Dropdown.Item key={value} onClick={() => selectOption(value)} style={optionStyle || {}}>
                    {value}
                </Dropdown.Item>))}
        </DropdownButton>
    );
};
