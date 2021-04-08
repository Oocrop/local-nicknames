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
const NicknameWrapper = require("./components/NicknameWrapper");
var _this;

function isAValidColor(color) {
    if (!color) return false;
    if (
        document.documentElement.classList.contains("theme-dark") &&
        color === "#000000"
    )
        return false;
    if (
        !document.documentElement.classList.contains("theme-dark") &&
        color === "#ffffff"
    )
        return false;
    return true;
}

module.exports = class LocalNicknames extends Plugin {
    async startPlugin() {
        _this = this;

        powercord.api.settings.registerSettings(this.entityID, {
            category: this.entityID,
            label: "Local Nicknames",
            render: PluginSettings
        });

        const messageHeader = await getModule(
            m =>
                (m.__powercordOriginal_default || m.default)
                    ?.toString()
                    .indexOf("headerText") > -1
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

        this.loadStylesheet("style.scss");

        inject(
            "local-nicknames_messageHeaderPatch",
            messageHeader,
            "default",
            this.messageHeaderPatch
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
            "local-nicknames_replyUsernamePatch",
            replyUsername,
            "default",
            this.replyUsernamePatch
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
        uninject("local-nicknames_messageHeaderPatch");
        uninject("local-nicknames_privateChannelPatch");
        uninject("local-nicknames_memberListItemPatch");
        uninject("local-nicknames_voiceUserPatch");
        uninject("local-nicknames_discordTagPatch");
        uninject("local-nicknames_replyUsernamePatch");
        uninject("local-nicknames_dmContextPatch");
        uninject("local-nicknames_groupDmContextPatch");
        uninject("local-nicknames_guildUserContextPatch");

        powercord.api.settings.unregisterSettings(this.entityID);
    }

    messageHeaderPatch(args, res) {
        if (!_this.settings.get("messageHeader", true)) return res;

        const message = args[0].message;
        const localEdit = _this.settings.get(message.author.id);
        if (!localEdit) return res;

        const usernameWrapper = findInReactTree(res, e => e.props?.message);

        if (!usernameWrapper) return res;
        if (usernameWrapper.__originalType) return res;

        usernameWrapper.props.__originalType = usernameWrapper.type;
        usernameWrapper.type = function (props) {
            const { __originalType: originalType, ...passedProps } = props;
            const result = originalType.apply(this, [passedProps]);
            const popout = findInReactTree(
                result,
                e => typeof e.props?.renderPopout === "function"
            );
            const popoutRendered = popout?.props?.children(popout.props);

            const reverted =
                (_this.settings.get("hoverType") & 1) === 1 &&
                _this.settings.get("hover");
            const tooltip =
                (_this.settings.get("hoverType") & 2) >> 1 === 1 &&
                _this.settings.get("hover");

            if (popoutRendered) {
                popoutRendered.props.className =
                    _this.settings.get("hover") && !tooltip
                        ? (popoutRendered.props.className
                              ? popoutRendered.props.className
                              : "") + " animate-nickname"
                        : popoutRendered.props.className;
                popoutRendered.props.children = React.createElement(
                    NicknameWrapper,
                    {
                        reverted,
                        tooltip,
                        hover: _this.settings.get("hover"),
                        original: {
                            nickname: popoutRendered.props.children,
                            style: popoutRendered.props.style
                        },
                        changed: localEdit,
                        isAValidColor
                    }
                );
                popout.props.children = () => popoutRendered;
            } else {
                const username = findInReactTree(
                    result,
                    e => typeof e.props?.children === "string"
                );
                if (!username) return result;
                username.props.className =
                    _this.settings.get("hover") && !tooltip
                        ? (username.props.className
                              ? username.props.className
                              : "") + " animate-nickname"
                        : username.props.className;
                username.props.children = React.createElement(NicknameWrapper, {
                    reverted,
                    tooltip,
                    hover: _this.settings.get("hover"),
                    original: {
                        nickname: username.props.children,
                        style: username.props.style
                    },
                    changed: localEdit,
                    isAValidColor
                });
            }
            return result;
        };

        return res;
    }

    privateChannelPatch(_, res) {
        if (!_this.settings.get("privateChannel", true)) return res;
        if (!this.props.user) return res;
        const localEdit = _this.settings.get(this.props.user.id);
        if (!localEdit) return res;

        const reverted =
            (_this.settings.get("hoverType") & 1) === 1 &&
            _this.settings.get("hover");
        const tooltip =
            (_this.settings.get("hoverType") & 2) >> 1 === 1 &&
            _this.settings.get("hover");

        res.props.name.props.className =
            _this.settings.get("hover") && !tooltip
                ? (res.props.name.props.className
                      ? res.props.name.props.className
                      : "") + " dm-channel animate-nickname"
                : res.props.name.props.className;

        res.props.name.props.children = React.createElement(NicknameWrapper, {
            reverted,
            tooltip,
            hover: _this.settings.get("hover"),
            original: {
                nickname: this.props.user.username,
                style: {}
            },
            changed: localEdit,
            isAValidColor
        });

        return res;
    }

    memberListItemPatch(_, res) {
        if (!_this.settings.get("memberList", true)) return res;
        if (!this.props.user) return res;
        const localEdit = _this.settings.get(this.props.user.id);
        if (!localEdit) return res;

        const reverted =
            (_this.settings.get("hoverType") & 1) === 1 &&
            _this.settings.get("hover");
        const tooltip =
            (_this.settings.get("hoverType") & 2) >> 1 === 1 &&
            _this.settings.get("hover");

        res.props.name.props.className =
            _this.settings.get("hover") && !tooltip
                ? (res.props.name.props.className
                      ? res.props.name.props.className
                      : "") + " animate-nickname"
                : res.props.name.props.className;

        res.props.name.props.children = React.createElement(NicknameWrapper, {
            reverted,
            tooltip,
            hover: _this.settings.get("hover"),
            original: {
                nickname: this.props.nick || this.props.user.username,
                style: res.props.name.props.style || {}
            },
            changed: localEdit,
            isAValidColor
        });

        return res;
    }

    voiceUserPatch(_, res) {
        if (!_this.settings.get("voiceUser", true)) return res;
        if (!res) return res;
        const localEdit = _this.settings.get(this.props.user.id);
        if (!localEdit) return res;

        const reverted =
            (_this.settings.get("hoverType") & 1) === 1 &&
            _this.settings.get("hover");
        const tooltip =
            (_this.settings.get("hoverType") & 2) >> 1 === 1 &&
            _this.settings.get("hover");

        res.props.className =
            _this.settings.get("hover") && !tooltip
                ? (res.props.className ? res.props.className : "") +
                  " voice-user animate-nickname"
                : res.props.className;

        res.props.children = React.createElement(NicknameWrapper, {
            reverted,
            tooltip,
            hover: _this.settings.get("hover"),
            original: {
                nickname: this.props.nick || this.props.user.username,
                style: {}
            },
            changed: localEdit,
            isAValidColor
        });

        return res;
    }

    discordTagPatch(args, res) {
        if (!_this.settings.get("discordTag", true)) return res;
        const localEdit = _this.settings.get(args[0].user.id);
        if (!localEdit) return res;

        const reverted =
            (_this.settings.get("hoverType") & 1) === 1 &&
            _this.settings.get("hover");
        const tooltip =
            (_this.settings.get("hoverType") & 2) >> 1 === 1 &&
            _this.settings.get("hover");

        const originalType = res.type;

        res.type = function (props) {
            const res = originalType(props);
            res.props.children[0].props.children = React.createElement(
                "span",
                {
                    className:
                        _this.settings.get("hover") && !tooltip
                            ? "discord-tag animate-nickname"
                            : ""
                },
                [
                    React.createElement(NicknameWrapper, {
                        reverted,
                        tooltip,
                        hover: _this.settings.get("hover"),
                        original: {
                            nickname: props.name,
                            style: {}
                        },
                        changed: localEdit,
                        isAValidColor
                    })
                ]
            );
            return res;
        };

        return res;
    }

    replyUsernamePatch(args, res) {
        if (!_this.settings.get("replies", true)) return res;
        const localEdit = _this.settings.get(args[0]?.message?.author.id);
        if (!localEdit) return res;

        if (res.props.__originalType) return;

        res.props.__originalType = res.type;
        res.type = function (props) {
            const { __originalType: originalType, ...passedProps } = props;
            const result = originalType.apply(this, [passedProps]);
            const popoutElement = findInReactTree(
                result,
                e =>
                    e.props &&
                    e.props.renderPopout &&
                    typeof e.props.children === "function"
            );

            if (localEdit && popoutElement) {
                const reverted =
                    (_this.settings.get("hoverType") & 1) === 1 &&
                    _this.settings.get("hover");
                const tooltip =
                    (_this.settings.get("hoverType") & 2) >> 1 === 1 &&
                    _this.settings.get("hover");
                const original = popoutElement.props.children(
                    result.props.children[1].props
                );
                original.props.className =
                    _this.settings.get("hover") && !tooltip
                        ? (original.props.className
                              ? original.props.className
                              : "") + " animate-nickname"
                        : original.props.className;
                original.props.children = [
                    props.withMentionPrefix ? "@" : null,
                    React.createElement(NicknameWrapper, {
                        reverted,
                        tooltip,
                        hover: _this.settings.get("hover"),
                        original: {
                            nickname: original.props.children,
                            style: result.props.style
                        },
                        changed: localEdit,
                        isAValidColor
                    })
                ];
                popoutElement.props.children = () => original;
            }
            return result;
        };

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
                                    (state.nickname === "" &&
                                        !isAValidColor(state.color))
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
            localEdit.nickname || isAValidColor(localEdit.color)
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
