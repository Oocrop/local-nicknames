const { Plugin } = require("powercord/entities");
const {
	getModule,
	getModuleByDisplayName,
	React,
	modal: { openModal, closeAllModals }
} = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");
const {
	Tooltip,
	Icon,
	Menu: { MenuGroup, MenuItem }
} = require("powercord/components");
const {
	findInReactTree,
	injectContextMenu,
	wrapInHooks
} = require("powercord/util");
const EditModal = require("./components/Modal");
const PluginSettings = require("./components/Settings");
const avatarManager = require("./avatarManager");
var _this;

module.exports = class LocalNicknames extends Plugin {
	uninjectQueue = [];

	async startPlugin() {
		_this = this;

		powercord.api.settings.registerSettings(this.entityID, {
			category: this.entityID,
			label: "Local Nicknames",
			render: PluginSettings
		});

		const chatUsername = await getModule(
			m =>
				(m.__powercordOriginal_default || m.default)
					?.toString()
					.indexOf("getGuildMemberAvatarURLSimple)({") > -1
		);
		const username = await getModule(
			m => m.default?.displayName === "Username"
		);
		const privateChannel = await getModuleByDisplayName("PrivateChannel");
		const userInfo = await getModule(
			m => m.default?.displayName === "UserInfo"
		);
		const memberListItemMemo = (
			await getModule(["AVATAR_DECORATION_PADDING"])
		).default;
		const voiceUser = await getModuleByDisplayName("VoiceUser");
		const userPopoutComponents = await getModule(["UserPopoutInfo"]);

		this.modalStack = await getModule(["push", "popWithKey"]);
		this.avatarModule = await getModule(["AnimatedAvatar"]);
		this.User = await getModule(m => m.prototype?.getAvatarURL);

		this.userHeaderClasses = await getModule(["headerTag"]);
		this.avatarClasses = await getModule(["largeAvatar"]);
		this.flexClasses = await getModule(["flex", "directionRow"]);

		this.loadStylesheet("style.css");

		this.lazyContextMenuPatch();
		inject(
			"local-nicknames_chatUsernamePatch",
			chatUsername,
			"default",
			this.chatUsernamePatch,
			true
		);
		inject(
			"local-nicknames_usernamePatch",
			username,
			"default",
			this.usernamePatch
		);
		inject(
			"local-nicknames_privateChannelPatch",
			privateChannel.prototype,
			"render",
			this.privateChannelPatch,
			true
		);
		inject(
			"local-nicknames_userInfoPatch",
			userInfo,
			"default",
			this.userInfoPatch,
			true
		);
		inject(
			"local-nicknames_voiceUserPatch",
			voiceUser.prototype,
			"renderName",
			this.voiceUserPatch
		);
		inject(
			"local-nicknames_voiceUserAvatarPatch",
			voiceUser.prototype,
			"renderAvatar",
			this.voiceUserAvatarPatch
		);
		inject(
			"local-nicknames_avatarPatch",
			this.avatarModule,
			"default",
			this.avatarPatch,
			true
		);
		inject(
			"local-nicknames_userPopoutInfoPatch",
			userPopoutComponents,
			"UserPopoutInfo",
			this.userPopoutInfoPatch
		);
		this.avatarModule.default.Sizes = this.avatarModule.Sizes;
		userInfo.default.displayName = "UserInfo";
		username.default.displayName = "Username";

		const memberListItem = wrapInHooks(
			() => memberListItemMemo.type().type
		)();

		inject(
			"local-nicknames_memberListItemPatch",
			memberListItem.prototype,
			"render",
			this.memberListItemPatch
		);
	}

	pluginWillUnload() {
		uninject("local-nicknames_chatUsernamePatch");
		uninject("local-nicknames_usernamePatch");
		uninject("local-nicknames_privateChannelPatch");
		uninject("local-nicknames_userInfoPatch");
		uninject("local-nicknames_memberListItemPatch");
		uninject("local-nicknames_voiceUserPatch");
		uninject("local-nicknames_voiceUserAvatarPatch");
		uninject("local-nicknames_avatarPatch");
		uninject("local-nicknames_userPopoutInfoPatch");
		this.uninjectQueue.forEach(e => uninject(e));

		powercord.api.settings.unregisterSettings(this.entityID);

		avatarManager.clearCache();
	}

	async lazyContextMenuPatch() {
		[
			"UserGenericContextMenu",
			"DMUserContextMenu",
			"GroupDMUserContextMenu",
			"GuildChannelUserContextMenu"
		].forEach(name => {
			injectContextMenu(
				`local-nicknames_${name}Patch`,
				name,
				this.contextPatch
			);
			this.uninjectQueue.push(`local-nicknames_${name}Patch`);
		});
	}

	chatUsernamePatch(args) {
		if (!_this.settings.get("inChat", true)) return args;
		if (!args[0]) return args;

		const localEdit = _this.settings.get(args[0].message.author.id);
		if (!localEdit) return args;

		if (localEdit.nickname) args[0].author.nick = localEdit.nickname;
		if (localEdit.color !== "default")
			args[0].author.colorString = localEdit.color;
		return args;
	}

	usernamePatch(
		[
			{
				message: {
					author: { id: userID }
				}
			}
		],
		res
	) {
		if (!_this.settings.get("replies", true)) return res;
		const localEdit = _this.settings.get(userID);
		if (localEdit) {
			if (localEdit.nickname) res.props.author.nick = localEdit.nickname;
			if (localEdit.color !== "default")
				res.props.author.colorString = localEdit.color;
		}
		return res;
	}

	privateChannelPatch(args) {
		if (!_this.settings.get("privateChannel", true)) return args;

		if (!this.props.user) return args;

		const localEdit = _this.settings.get(this.props.user.id);
		const avatar = avatarManager.getAvatarUrl(this.props.user.id);
		if (!localEdit) return args;

		if (localEdit.nickname)
			this.props.channelName = React.createElement(
				"span",
				{ style: { color: localEdit.color } },
				localEdit.nickname
			);
		if (avatar) this.props.user.getAvatarURL = () => avatar;

		return args;
	}

	userInfoPatch(args) {
		if (!_this.settings.get("friendsList", true)) return args;
		const localEdit = _this.settings.get(args[0].user.id);
		if (!localEdit) return args;
		const avatar = avatarManager.getAvatarUrl(args[0].user.id);

		const copy = new _this.User(args[0].user);
		avatar && (copy.getAvatarURL = () => avatar);
		localEdit.nickname && (copy.username = localEdit.nickname);
		args[0].user = copy;
		return args;
	}

	memberListItemPatch(_, res) {
		if (!_this.settings.get("memberList", true)) return res;

		if (!this.props.user) return res;

		const localEdit = _this.settings.get(this.props.user.id);
		const avatar = avatarManager.getAvatarUrl(this.props.user.id);
		if (!localEdit) return res;

		if (localEdit.nickname)
			res.props.name.props.children = localEdit.nickname;
		if (localEdit.color !== "default")
			res.props.name.props.style = { color: localEdit.color };
		if (avatar) res.props.avatar.props.src = avatar;

		return res;
	}

	voiceUserPatch(_, res) {
		if (!_this.settings.get("voiceUser", true)) return res;
		if (!res) return res;

		const localEdit = _this.settings.get(this.props.user.id);
		if (!localEdit) return res;

		if (localEdit.nickname) res.props.children = localEdit.nickname;
		if (localEdit.color !== "default")
			res.props.style = { color: localEdit.color };

		return res;
	}
	voiceUserAvatarPatch(_, res) {
		const avatar = avatarManager.getAvatarUrl(this.props.user.id);
		if (!avatar) return res;
		res.props.style.backgroundImage = "url(" + avatar + ")";
		return res;
	}

	avatarPatch(args) {
		const [props] = args;
		if (props.size !== "SIZE_40") return args;
		const userId = props.userId || props.src?.split("/")[4];
		if (!userId) return args;
		const avatar = avatarManager.getAvatarUrl(userId);
		if (avatar) props.src = avatar;
		return args;
	}

	userPopoutInfoPatch(args, res) {
		const localEdit = _this.settings.get(args[0].user.id);
		const avatar = avatarManager.getAvatarUrl(args[0].user.id);
		if (!localEdit) return res;
		const usernameWrapper = findInReactTree(res, e =>
			e.children?.find(e => e?.type?.displayName === "DiscordTag")
		);
		usernameWrapper.children.splice(
			2,
			0,
			React.createElement(
				"div",
				{
					className: [
						_this.flexClasses.flex,
						_this.flexClasses.directionRow,
						_this.flexClasses.alignCenter
					].join(" ")
				},
				React.createElement(usernameWrapper.children[1].type, {
					className: [
						_this.userHeaderClasses.headerTag,
						localEdit.nickname !== ""
							? _this.userHeaderClasses.headerTagWithNickname
							: ""
					]
						.join(" ")
						.trim(),
					user: {
						id: "0",
						username: localEdit.nickname,
						discriminator: "0000",
						isSystemUser: () => false,
						isVerifiedBot: () => false,
						toString: () =>
							React.createElement(
								"span",
								{
									style: {
										color:
											localEdit.color === "default"
												? ""
												: localEdit.color
									}
								},
								localEdit.nickname
							)
					},
					hideDiscriminator: true,
					usernameClass:
						_this.userHeaderClasses.headerTagUsernameBase,
					usernameIcon: avatar
						? React.createElement(_this.avatarModule.default, {
								src: avatar,
								size:
									localEdit.nickname === ""
										? "SIZE_24"
										: "SIZE_16",
								className:
									localEdit.nickname === ""
										? _this.avatarClasses.largeAvatar
										: _this.avatarClasses.miniAvatar
						  })
						: null
				}),
				React.createElement(
					Tooltip,
					{ text: "Local Edit" },
					React.createElement(Icon, {
						name: "Pencil",
						className:
							_this.userHeaderClasses.headerTagUsernameBase,
						height: 16,
						width: 16
					})
				)
			)
		);
		return res;
	}

	contextPatch(args, res) {
		const user = args[0].user;
		const emptyObj = {};
		const localEdit = _this.settings.get(user.id, emptyObj);

		const customGroup = React.createElement(MenuGroup, null, [
			React.createElement(MenuItem, {
				id: "local-nicknames-edit",
				label: "Edit Local Nickname",
				action: () => {
					openModal(() =>
						React.createElement(EditModal, {
							user: user,
							edit: localEdit,
							limit: _this.settings.get("limit", false),
							close: state => {
								if (
									!state.nickname &&
									(!state.color ||
										state.color === "default") &&
									!avatarManager.getAvatarUrl(user.id)
								)
									_this.settings.delete(user.id);
								else _this.settings.set(user.id, state);
								closeAllModals("local-nicknames-modal");
							}
						})
					);
				}
			}),
			localEdit !== emptyObj
				? React.createElement(MenuItem, {
						id: "local-nicknames-reset",
						label: "Reset Local Nickname",
						action: () => {
							_this.settings.delete(user.id);
							avatarManager.removeAvatar(user.id);
						}
				  })
				: null
		]);

		const groups = res.props.children;

		const devGroup = groups.find(
			c =>
				c &&
				c.props &&
				c.props.children &&
				c.props.children.props &&
				c.props.children.props.id === "devmode-copy-id"
		);

		if (devGroup) {
			groups.splice(groups.indexOf(devGroup), 0, customGroup);
		} else {
			groups.push(customGroup);
		}

		return res;
	}
};
