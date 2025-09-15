/*
 * Drop down button that starts with a default but updates to take a value.
 */
import React, { CSSProperties } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

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
    const { initialLabel, onClick, options, optionStyle, style } = props;
    let { id, variant } = props;
    id ??= initialLabel.replace(/\s+/g, "-");
    variant ??= "info";

    const [currentLabel, setCurrentLabel] = React.useState(initialLabel);

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
