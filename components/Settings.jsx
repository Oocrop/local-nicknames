const {
    settings: { Category, SwitchItem, SelectInput }
} = require("powercord/components");
const { React } = require("powercord/webpack");

module.exports = class Settings extends React.Component {
    constructor(...args) {
        super(...args);

        this.state = { categoryOpen: false };
    }

    render() {
        const { getSetting, toggleSetting, updateSetting } = this.props;

        return (
            <>
                <SwitchItem
                    value={getSetting("hover", false)}
                    onChange={() => toggleSetting("hover", false)}
                    note="Causes weird spacing if original nickname is longer than local"
                >
                    Show original nickname on hover
                </SwitchItem>
                <SelectInput
                    value={getSetting("hoverType", 0)}
                    onChange={value => updateSetting("hoverType", value.value)}
                    disabled={!getSetting("hover", false)}
                    options={[
                        {
                            value: 0,
                            label: "Animation"
                        },
                        {
                            value: 1,
                            label: "Animation (reverted)"
                        },
                        {
                            value: 2,
                            label: "Tooltip"
                        },
                        {
                            value: 3,
                            label: "Tooltip (reverted)"
                        }
                    ]}
                >
                    Original nickname display type
                </SelectInput>
                <SwitchItem
                    value={getSetting("limit", false)}
                    onChange={() => toggleSetting("limit", false)}
                    note="I am not responsible for any issue this might cause"
                >
                    Disable nicknames length limit
                </SwitchItem>
                <Category
                    name="Where to display"
                    opened={this.state.categoryOpen}
                    onChange={() =>
                        this.setState({
                            categoryOpen: !this.state.categoryOpen
                        })
                    }
                >
                    <SwitchItem
                        value={getSetting("messageHeader", true)}
                        onChange={() => toggleSetting("messageHeader", true)}
                    >
                        Message Header
                    </SwitchItem>
                    <SwitchItem
                        value={getSetting("privateChannel", true)}
                        onChange={() => toggleSetting("privateChannel", true)}
                    >
                        DM Tab
                    </SwitchItem>
                    <SwitchItem
                        value={getSetting("memberList", true)}
                        onChange={() => toggleSetting("memberList", true)}
                    >
                        Member List
                    </SwitchItem>
                    <SwitchItem
                        value={getSetting("voiceUser", true)}
                        onChange={() => toggleSetting("voiceUser", true)}
                    >
                        Voice Channels
                    </SwitchItem>
                    <SwitchItem
                        note="This applies to User Popout/Profile, Mutual Friends, Reactors"
                        value={getSetting("discordTag", true)}
                        onChange={() => toggleSetting("discordTag", true)}
                    >
                        Discord Tag
                    </SwitchItem>
                </Category>
            </>
        );
    }
};
