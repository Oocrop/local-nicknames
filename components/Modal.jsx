const {
	React,
	i18n: { Messages },
	getModule,
	constants: { ROLE_COLORS }
} = require("powercord/webpack");
const { AsyncComponent, Button } = require("powercord/components");
const avatarManager = require("../avatarManager");

let FormTitle;
let FormItem;
let ModalRoot;
let Header;
let Content;
let Footer;
let ColorPicker;
let TextInput;
let marginClasses;
let flexClasses;
let AvatarUploader;

function decimalToHex(number) {
	const hex = number.toString(16);
	return "#" + ("000000".substring(0, 6 - hex.length) + hex);
}

function hexToDecimal(hex) {
	hex = hex.replace("#", "");
	return parseInt(hex, 16);
}

class EditNicknameModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			nickname: props.edit.nickname || "",
			color: props.edit.color || "default",
			avatar:
				avatarManager.getAvatarUrl(this.props.user.id) ||
				this.props.user.getAvatarURL()
		};
	}

	render() {
		return (
			<ModalRoot size="dynamic" transitionState={1}>
				<Header separator={false}>
					<FormTitle tag={FormTitle.Tags.H4}>
						{this.props.user.username}
					</FormTitle>
				</Header>
				<Content>
					<div
						className={[
							flexClasses.flex,
							flexClasses.directionRow,
							marginClasses.marginBottom20
						].join(" ")}
						style={{ gap: "25px" }}
					>
						<AvatarUploader
							avatar={this.state.avatar}
							avatarClassName="avatarUploaderInner-2EvNMg"
							showIcon={true}
							showRemoveButton={avatarManager.getAvatarUrl(
								this.props.user.id
							)}
							onChange={dataUri => {
								if (dataUri === null)
									return (
										avatarManager.removeAvatar(
											this.props.user.id
										),
										this.updateAvatar()
									);
								try {
									avatarManager.setAvatar(
										this.props.user.id,
										dataUri
									);
									this.updateAvatar();
								} catch (e) {}
							}}
						/>
						<FormItem style={{ width: "100%" }}>
							<FormTitle>
								{"Nickname, " +
									this.state.nickname.length +
									(this.props.limit ? "/∞ (1024)" : "/32")}
							</FormTitle>
							<TextInput
								onChange={_ => this.setNickname(_)}
								placeholder={this.props.user.username}
								value={this.state.nickname}
								maxlength={this.props.limit ? 1024 : 32}
							/>
						</FormItem>
					</div>
					<FormItem className={marginClasses.marginBottom20}>
						<FormTitle>Color</FormTitle>
						<ColorPicker
							onChange={_ => this.setColor(decimalToHex(_))}
							value={hexToDecimal(
								this.state.color === "default"
									? document.documentElement.classList.contains(
											"theme-dark"
									  )
										? "#ffffff"
										: "#000000"
									: this.state.color
							)}
							defaultColor={hexToDecimal(
								document.documentElement.classList.contains(
									"theme-dark"
								)
									? "#ffffff"
									: "#000000"
							)}
							colors={ROLE_COLORS}
						/>
					</FormItem>
				</Content>
				<Footer>
					<Button
						type="submit"
						onClick={() =>
							this.props.close({
								nickname: this.state.nickname,
								color: this.state.color
							})
						}
						autoFocus={true}
					>
						{Messages.DONE}
					</Button>
					<Button
						onClick={() => this.props.close(this.props.edit)}
						look={Button.Looks.LINK}
						color={Button.Colors.PRIMARY}
					>
						{Messages.CANCEL}
					</Button>
				</Footer>
			</ModalRoot>
		);
	}

	updateAvatar() {
		this.setState(prevState =>
			Object.assign(prevState, {
				avatar:
					avatarManager.getAvatarUrl(this.props.user.id) ||
					this.props.user.getAvatarURL()
			})
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
		this.setState(prevState =>
			Object.assign(prevState, {
				color:
					color === "#000000" || color === "#ffffff"
						? "default"
						: color
			})
		);
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
		ColorPicker = await getModule(
			m => m.displayName === "ColorPicker" && m.defaultProps
		);
		TextInput = await getModule(m => m.displayName === "TextInput");
		marginClasses = await getModule(["marginBottom20"]);
		flexClasses = await getModule(["flex", "directionRow"]);
		AvatarUploader = await getModule(
			m => m.displayName === "AvatarUploader"
		);

		resolve(EditNicknameModal);
	})
);
