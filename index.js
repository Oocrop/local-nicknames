const { Plugin } = require("powercord/entities");
const {
	getModule,
	getModuleByDisplayName,
	React
} = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");
const {
	Menu: { MenuGroup, MenuItem }
} = require("powercord/components");
const { findInReactTree } = require("powercord/util");
const EditModal = require("./components/Modal");
const PluginSettings = require("./components/Settings");
var _this;

module.exports = class LocalNicknames extends Plugin {
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
		const privateChannel = await getModuleByDisplayName("PrivateChannel");
		const memberListItem = await getModuleByDisplayName("MemberListItem");
		const voiceUser = await getModuleByDisplayName("VoiceUser");
		const replyUsername = await getModule(
			m => m.default?.displayName === "Username"
		);
		const discordTag = await getModule(
			m => m.default?.displayName === "DiscordTag"
		);
		const dmUserContextMenu = await getModule(
			m => m.default?.displayName === "DMUserContextMenu"
		);
		const groupDmUserContextMenu = await getModule(
			m => m.default?.displayName === "GroupDMUserContextMenu"
		);
		const guildUserContextMenu = await getModule(
			m => m.default?.displayName === "GuildChannelUserContextMenu"
		);

		this.modalStack = await getModule(["push", "popWithKey"]);

		this.loadStylesheet("style.css");

		inject(
			"local-nicknames_chatUsernamePatch",
			chatUsername,
			"default",
			this.chatUsernamePatch
		);
		inject(
			"local-nicknames_privateChannelPatch",
			privateChannel.prototype,
			"render",
			this.privateChannelPatch
		);
		inject(
			"local-nicknames_memberListItemPatch",
			memberListItem.prototype,
			"render",
			this.memberListItemPatch
		);
		inject(
			"local-nicknames_voiceUserPatch",
			voiceUser.prototype,
			"renderName",
			this.voiceUserPatch
		);
		inject(
			"local-nicknames_discordTagPatch",
			discordTag,
			"default",
			this.discordTagPatch
		);
		inject(
			"local-nicknames_dmContextPatch",
			dmUserContextMenu,
			"default",
			this.contextPatch
		);
		inject(
			"local-nicknames_groupDmContextPatch",
			groupDmUserContextMenu,
			"default",
			this.contextPatch
		);
		inject(
			"local-nicknames_guildUserContextPatch",
			guildUserContextMenu,
			"default",
			this.contextPatch
		);
		discordTag.default.displayName = "DiscordTag";
		replyUsername.default.displayName = "Username";
		dmUserContextMenu.default.displayName = "DMUserContextMenu";
		groupDmUserContextMenu.default.displayName = "GroupDMUserContextMenu";
		guildUserContextMenu.default.displayName =
			"GuildChannelUserContextMenu";
	}

	pluginWillUnload() {
		uninject("local-nicknames_chatUsernamePatch");
		uninject("local-nicknames_privateChannelPatch");
		uninject("local-nicknames_memberListItemPatch");
		uninject("local-nicknames_voiceUserPatch");
		uninject("local-nicknames_discordTagPatch");
		uninject("local-nicknames_dmContextPatch");
		uninject("local-nicknames_groupDmContextPatch");
		uninject("local-nicknames_guildUserContextPatch");

		powercord.api.settings.unregisterSettings(this.entityID);
	}

	chatUsernamePatch(args, res) {
		if (
			!args[0].hasOwnProperty("withMentionPrefix") &&
			!_this.settings.get("inChat", true)
		)
			return res;
		if (
			args[0].hasOwnProperty("withMentionPrefix") &&
			!_this.settings.get("replies", true)
		)
			return res;

		const message = args[0].message;
		const localEdit = _this.settings.get(message.author.id);
		if (!localEdit) return res;

		const popout = findInReactTree(
			res,
			e => typeof e.props?.renderPopout === "function"
		);
		const popoutChildrenRendered = popout?.props?.children(popout.props);

		if (popoutChildrenRendered) {
			popoutChildrenRendered.props.children = [
				args[0].withMentionPrefix ? "@" : null,
				localEdit.nickname
			];
			if (localEdit.color !== "default")
				popoutChildrenRendered.props.style = { color: localEdit.color };
			popout.props.children = () => popoutChildrenRendered;
		} else {
			const username = findInReactTree(
				res,
				e => typeof e.props?.children === "string"
			);
			if (!username) return res;
			username.props.children = localEdit.nickname;
			if (localEdit.color !== "default")
				username.props.style = { color: localEdit.color };
		}
		return res;
	}

	privateChannelPatch(_, res) {
		if (!_this.settings.get("privateChannel", true)) return res;
		if (!this.props.user) return res;
		const localEdit = _this.settings.get(this.props.user.id);
		if (!localEdit) return res;

		res.props.name.props.children = localEdit.nickname;
		if (localEdit.color !== "default")
			res.props.name.props.style = { color: localEdit.color };

		return res;
	}

	memberListItemPatch(_, res) {
		if (!_this.settings.get("memberList", true)) return res;
		if (!this.props.user) return res;
		const localEdit = _this.settings.get(this.props.user.id);
		if (!localEdit) return res;

		res.props.name.props.children = localEdit.nickname;
		if (localEdit.color !== "default")
			res.props.name.props.style = { color: localEdit.color };

		return res;
	}

	voiceUserPatch(_, res) {
		if (!_this.settings.get("voiceUser", true)) return res;
		if (!res) return res;
		const localEdit = _this.settings.get(this.props.user.id);
		if (!localEdit) return res;

		res.props.children = localEdit.nickname;
		if (localEdit.color !== "default")
			res.props.style = { color: localEdit.color };

		return res;
	}

	contextPatch(args, res) {
		const user = args[0].user;
		const localEdit = _this.settings.get(user.id, {});

		const customGroup = React.createElement(MenuGroup, null, [
			React.createElement(MenuItem, {
				id: "local-nicknames-edit",
				label: "Edit Local Nickname",
				action: () => {
					_this.modalStack.push(
						EditModal,
						{
							username: user.username,
							changed: localEdit,
							limit: _this.settings.get("limit", false),
							close: state => {
								if (
									state === {} ||
									(state.nickname &&
										state.nickname === "" &&
										state.color &&
										state.color === "default")
								)
									_this.settings.delete(user.id);
								else _this.settings.set(user.id, state);
								_this.modalStack.popWithKey(
									"local-nicknames-modal"
								);
							}
						},
						"local-nicknames-modal"
					);
				}
			}),
			(localEdit.nickname && localEdit.nickname !== "") ||
			(localEdit.color && localEdit.color !== "default")
				? React.createElement(MenuItem, {
						id: "local-nicknames-reset",
						label: "Reset Local Nickname",
						action: () => {
							_this.settings.delete(user.id);
						}
				  })
				: null
		]);

		const groups = res.props.children.props.children;

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
