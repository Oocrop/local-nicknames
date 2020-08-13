const { React, i18n: { Messages }, getModule, getModuleByDisplayName, constants: { ROLE_COLORS } } = require("powercord/webpack");
const {
    AsyncComponent,
    Button,
    settings: {
        FormItem,
        TextInput
    }
} = require("powercord/components");

var FormTitle;
var ModalRoot;
var Header;
var Content;
var Footer;

var ColorPicker;

function decimalToHex(number) {
    return "#" + ("0" + ((number & 0xff0000) >> 16).toString(16)).substr(-2, 2) + ("0" + ((number & 0x00ff00) >> 8).toString(16)).substr(-2, 2) + ("0" + (number & 0x0000ff).toString(16)).substr(-2, 2);
}

function hexToDecimal(hex) {
    hex = hex.replace("#", "");
    return ((parseInt(hex.substr(0, 2), 16)) << 16) + ((parseInt(hex.substr(2, 2), 16)) << 8) + ((parseInt(hex.substr(4, 2), 16)));
}

class EditNicknameModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            nickname: props.defaults.nickname || "",
            color: props.defaults.color || (document.documentElement.classList.contains("theme-dark") ? "#000000" : "#ffffff")
        };
    }

    render() {
        return (
            <ModalRoot transitionState={1}>
                <Header>
                    <FormTitle tag={FormTitle.Tags.H4}>{this.props.username}</FormTitle>
                </Header>
                <Content>
                    <TextInput
                        onChange={_ => this.setNickname(_)}
                        placeholder={this.props.username}
                        value={this.state.nickname}
                        maxlength={32}
                    >{"Nickname, " + this.state.nickname.length + "/32"}</TextInput>
                    <FormItem
                        title="Color"
                    >
                        <ColorPicker
                            onChange={_ => this.setColor(decimalToHex(_))}
                            value={hexToDecimal(this.state.color)}
                            defaultColor={hexToDecimal(document.documentElement.classList.contains("theme-dark") ? "#000000" : "#ffffff") - 16777216}
                            colors={ROLE_COLORS.map(c => c)}
                        ></ColorPicker>
                    </FormItem>
                </Content>
                <Footer>
                    <Button
                        type="submit"
                        onClick={() => this.props.close(this.state)}
                        autoFocus={true}
                    >{Messages.DONE}</Button>
                    <Button
                        onClick={() => this.props.close(this.props.defaults)}
                        look={Button.Looks.LINK}
                        color={Button.Colors.PRIMARY}
                    >{Messages.CANCEL}</Button>
                </Footer>
            </ModalRoot >
        );
    }

    setNickname(nickname) {
        this.setState(prevState => Object.assign(prevState, { nickname: nickname.substr(0, 32) }));
    }
    setColor(color) {
        this.setState(prevState => Object.assign(prevState, { color: color }));
    }
}

module.exports = AsyncComponent.from(new Promise(async (resolve) => {
    FormTitle = await getModule(["FormTitle"], false).FormTitle;
    const ModalModule = await getModule(["ModalRoot"], false);
    ModalRoot = ModalModule.ModalRoot;
    Header = ModalModule.ModalHeader;
    Content = ModalModule.ModalContent;
    Footer = ModalModule.ModalFooter;

    // thanks to Bowser65 and Juby210 for the help!
    ColorPicker = (await getModuleByDisplayName("ColorPicker")) || await (async () => {
        const FluxSettings = await getModuleByDisplayName('FluxContainer(GuildSettingsRoles)');
        const Settings = FluxSettings.prototype.render.call({ memoizedGetStateFromStores: () => void 0 });
        const roleSettings = Settings.type.prototype.renderRoleSettings.call({ props: { guild: { isOwner: () => true }, currentUser: {} }, getSelectedRole: () => '', renderHeader: () => null }).props.children[1];
        const colorTooltip = roleSettings.type.prototype.renderColorPicker.call(roleSettings);
        const colorSuspense = colorTooltip.props.children.props.children();
        const colorLazy = colorSuspense.props.children.type();
        const module = await colorLazy.props.children.type._ctor();
        return module.default;
    })();

    resolve(EditNicknameModal);
}));