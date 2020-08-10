const { React, i18n: { Messages }, getModule } = require("powercord/webpack");
const {
    Button,
    settings: {
        FormItem,
        TextInput
    }
} = require("powercord/components");

const FormTitle = getModule(["FormTitle"], false).FormTitle;
const ModalModule = getModule(["ModalRoot"], false);
const ModalRoot = ModalModule.ModalRoot;
const Header = ModalModule.ModalHeader;
const Content = ModalModule.ModalContent;
const Footer = ModalModule.ModalFooter;

module.exports = class EditNicknameModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            nickname: props.defaults.nickname || "",
            color: props.defaults.color || document.documentElement.classList.contains("theme-dark") ? "#000000" : "#ffffff"
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
                        <input
                            type="color"
                            onChange={_ => this.setColor(_.target.value)}
                            value={this.state.color}
                            style={
                                {
                                    background: "rgba(0,0,0.2)",
                                    borderRadius: "5px",
                                    margin: "0",
                                    width: "50px",
                                    height: "50px"
                                }
                            }
                        ></input>
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
        console.info(color);
        this.setState(prevState => Object.assign(prevState, { color: color }));
    }
}