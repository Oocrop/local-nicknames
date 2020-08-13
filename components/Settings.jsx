const { settings: { Category, SwitchItem } } = require("powercord/components");
const { React } = require("powercord/webpack");

module.exports = class Settings extends React.Component {
    constructor(...args) {
        super(...args);

        this.state = { categoryOpen: false };
    }

    render() {
        const { getSetting, toggleSetting } = this.props;

        return <>
            <SwitchItem
                value={getSetting("hover", true)}
                onChange={() => toggleSetting("hover", true)}
                note="Causes weird spacing if original nickname is longer than local"
            >Show original nickname on hover</SwitchItem>
            <Category
                name="Where to display"
                opened={this.state.categoryOpen}
                onChange={() => this.setState({ categoryOpen: !this.state.pluginsCategoryOpen })}
            >
                <SwitchItem
                    value={getSetting("messageHeader", true)}
                    onChange={() => toggleSetting("messageHeader", true)}
                >Message Header</SwitchItem>
                <SwitchItem
                    value={getSetting("privateChannel", true)}
                    onChange={() => toggleSetting("privateChannel", true)}
                >DM Tab</SwitchItem>
                <SwitchItem
                    value={getSetting("memberList", true)}
                    onChange={() => toggleSetting("memberList", true)}
                >Member List</SwitchItem>
                <SwitchItem
                    value={getSetting("voiceUser", true)}
                    onChange={() => toggleSetting("voiceUser", true)}
                >Voice Channels</SwitchItem>
                <SwitchItem
                    note="This applies to User Popout/Profile, Mutual Friends, Reactors"
                    value={getSetting("discordTag", true)}
                    onChange={() => toggleSetting("discordTag", true)}
                >Discord Tag</SwitchItem>
            </Category>
        </>;
    }
}