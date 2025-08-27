/*
 * Generic omponent to display a set of filter options with a switchbar at the top.
 */
import Form from "react-bootstrap/esm/Form";
import { CSSProperties, ReactElement } from "react";

import SubAccordion, { SubAccordionProps } from "../helpers/SubAccordion";
import { boldFont, roundedBox } from "../../helpers/style_helpers";
import { horizontalSpacer } from "../../helpers/react_helpers";

interface FilterAccordionSectionProps extends SubAccordionProps {
    footerSwitches?: ReactElement[] | null,
    switchbar: ReactElement[],
};


export default function FilterAccordionSection(props: FilterAccordionSectionProps) {
    let { footerSwitches, switchbar } = props;

    // Default spacing is too far off center if there"s only two switches
    if (switchbar.length == 2) {
        switchbar = [horizontalSpacer(20, "1"), ...switchbar, horizontalSpacer(20, "2")];
    }

    return (
        <SubAccordion {...props}>
            {/* Top bar with invert/sort/etc. switches */}
            <div style={switchesContainer} key={"filterSwitchContainer"}>
                {switchbar}
            </div>

            <div style={filterSwitchContainer} key={"filter_accordionBody"}>
                <Form.Group className="mb-1">
                    <Form.Group className="mb-1">
                        {props.children}
                    </Form.Group>
                </Form.Group>
            </div>

            {footerSwitches &&
                <div style={footerContainer} key={"footerSwitchContainer"}>
                    {footerSwitches}
                </div>}
        </SubAccordion>
    );
};


const filterSwitchContainer: CSSProperties = {
    ...roundedBox,
    paddingTop: "10px",
    paddingBottom: "5px",
    paddingRight: "15px",
};

const switchesContainer: CSSProperties = {
    ...boldFont,
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    fontSize: 16,
    height: "25px",
    justifyContent: "space-around",
    marginBottom: "3px",
};

const footerContainer: CSSProperties = {
    ...switchesContainer,
    justifyContent: "space-around",
    marginBottom: "0px",
    marginTop: "7px",
};
