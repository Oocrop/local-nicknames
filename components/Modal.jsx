const {
    React,
    i18n: { Messages },
    getModule,
    getModuleByDisplayName,
    constants: { ROLE_COLORS }
} = require("powercord/webpack");
const {
    AsyncComponent,
    Button,
    settings: { TextInput }
} = require("powercord/components");

let FormTitle;
let FormItem;
let ModalRoot;
let Header;
let Content;
let Footer;
let ColorPicker;
let marginBottom20;

function decimalToHex(number) {
    return "#" + number.toString(16);
}

function hexToDecimal(hex) {
    hex = hex.replace("#", "");
    return parseInt(hex, 16);
}

class EditNicknameModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            nickname: props.changed.nickname || "",
            color:
                props.changed.color ||
                (document.documentElement.classList.contains("theme-dark")
                    ? "#000000"
                    : "#ffffff")
        };
    }

    render() {
        return (
            <ModalRoot transitionState={1}>
                <Header>
                    <FormTitle tag={FormTitle.Tags.H4}>
                        {this.props.username}
                    </FormTitle>
                </Header>
                <Content>
                    <TextInput
                        onChange={_ => this.setNickname(_)}
                        placeholder={this.props.username}
                        value={this.state.nickname}
                        maxlength={this.props.limit ? 1024 : 32}
                    >
                        {"Nickname, " +
                            this.state.nickname.length +
                            (this.props.limit ? "/∞ (1024)" : "/32")}
                    </TextInput>
                    <FormItem className={marginBottom20}>
                        <FormTitle>Color</FormTitle>
                        <ColorPicker
                            onChange={_ => this.setColor(decimalToHex(_))}
                            value={hexToDecimal(this.state.color)}
                            defaultColor={
                                hexToDecimal(
                                    document.documentElement.classList.contains(
                                        "theme-dark"
                                    )
                                        ? "#000000"
                                        : "#ffffff"
                                ) - 16777216
                            }
                            colors={ROLE_COLORS.map(c => c)}
                        />
                    </FormItem>
                </Content>
                <Footer>
                    <Button
                        type="submit"
                        onClick={() => this.props.close(this.state)}
                        autoFocus={true}
                    >
                        {Messages.DONE}
                    </Button>
                    <Button
                        onClick={() => this.props.close(this.props.changed)}
                        look={Button.Looks.LINK}
                        color={Button.Colors.PRIMARY}
                    >
                        {Messages.CANCEL}
                    </Button>
                </Footer>
            </ModalRoot>
        );
    }

    setNickname(nickname) {
        this.setState(prevState =>
            Object.assign(prevState, {
                nickname: nickname.substr(0, this.props.limit ? 1024 : 32)
            })
        );
    }
    setColor(color) {
        this.setState(prevState => Object.assign(prevState, { color: color }));
    }
}

module.exports = AsyncComponent.from(
    new Promise(async resolve => {
        const FormModule = await getModule(["FormTitle"]);
        FormTitle = FormModule.FormTitle;
        FormItem = FormModule.FormItem;
        const ModalModule = await getModule(["ModalRoot"]);
        ModalRoot = ModalModule.ModalRoot;
        Header = ModalModule.ModalHeader;
        Content = ModalModule.ModalContent;
        Footer = ModalModule.ModalFooter;
        ColorPicker =
            (await getModule(m => m.displayName === "ColorPicker")) ||
            AsyncComponent.from(
                (async () => {
                    const DecoratedGuildSettingsRoles = await getModuleByDisplayName(
                        "FluxContainer(GuildSettingsRoles)"
                    );
                    const GuildSettingsRoles = DecoratedGuildSettingsRoles.prototype.render.call(
                        { memoizedGetStateFromStores: () => void 0 }
                    ).type;
                    const SettingsPanel = GuildSettingsRoles.prototype.renderRoleSettings.call(
                        {
                            props: { guild: { isOwner: () => true } },
                            renderHeader: () => null,
                            getSelectedRole: () => "0"
                        }
                    ).props.children[1].type;
                    const SuspendedPicker = SettingsPanel.prototype.renderColorPicker.call(
                        { props: { role: {} } }
                    ).props.children.type;
                    const mdl = await SuspendedPicker().props.children.type._ctor();
                    return mdl.default;
                })()
            );
        marginBottom20 = (await getModule(["marginBottom20"])).marginBottom20;

        resolve(EditNicknameModal);
    })
);
