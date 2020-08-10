const { Plugin } = require("powercord/entities");
const { getModule, React } = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");
const { Menu: { MenuGroup, MenuItem } } = require("powercord/components");
const EditModal = require("./Modal");
var _this;

function isAValidColor(color) {
    if (!color) return false;
    if (document.documentElement.classList.contains("theme-dark") && color == "#000000") return false;
    if (!document.documentElement.classList.contains("theme-dark") && color == "#ffffff") return false;
    return true;
}

module.exports = class LocalNicknames extends Plugin {
    async startPlugin() {
        _this = this;
        const messageHeader = await getModule(["MessageTimestamp"]);
        const privateChannel = await getModule(m => m.displayName == "PrivateChannel");
        const memberListItem = await getModule(m => m.displayName == "MemberListItem");
        const discordTag = await getModule(m => m.default && m.default.displayName == "DiscordTag");
        const dmUserContextMenu = await getModule(m => m.default && m.default.displayName == "DMUserContextMenu");
        const groupDmUserContextMenu = await getModule(m => m.default && m.default.displayName == "GroupDMUserContextMenu");
        const guildUserContextMenu = await getModule(m => m.default && m.default.displayName == "GuildChannelUserContextMenu");
        
        this.modalStack = await getModule(["push", "popWithKey"]);

        this.loadStylesheet("style.scss");

        inject("local-nicknames_messageHeaderPatch", messageHeader, "default", this.messageHeaderPatch);
        inject("local-nicknames_privateChannelPatch", privateChannel.prototype, "render", this.privateChannelPatch);
        inject("local-nicknames_memberListItemPatch", memberListItem.prototype, "render", this.memberListItemPatch);
        inject("local-nicknames_discordTagPatch", discordTag, "default", this.discordTagPatch);
        inject("local-nicknames_dmContextPatch", dmUserContextMenu, "default", this.contextPatch);
        inject("local-nicknames_groupDmContextPatch", groupDmUserContextMenu, "default", this.contextPatch);
        inject("local-nicknames_guildUserContextPatch", guildUserContextMenu, "default", this.contextPatch);
        discordTag.default.displayName = "DiscordTag";
        dmUserContextMenu.default.displayName = "DMUserContextMenu";
        groupDmUserContextMenu.default.displayName = "GroupDMUserContextMenu";
        guildUserContextMenu.default.displayName = "GuildChannelUserContextMenu";
    }

    pluginWillUnload() {
        uninject("local-nicknames_messageHeaderPatch");
        uninject("local-nicknames_privateChannelPatch");
        uninject("local-nicknames_memberListItemPatch");
        uninject("local-nicknames_discordTagPatch");
        uninject("local-nicknames_dmContextPatch");
        uninject("local-nicknames_groupDmContextPatch");
        uninject("local-nicknames_guildUserContextPatch");
    }

    messageHeaderPatch(args, res) {
        const usernameWrapper = res.props.children[1].props.children[1].props.children[1];
        const message = args[0].message;
        if (!usernameWrapper) return res;
        if (usernameWrapper.props.__originalChildren) return res;
        usernameWrapper.props.__originalChildren = usernameWrapper.props.children;
        usernameWrapper.props.children = function (...args) {
            const result = usernameWrapper.props.__originalChildren.apply(this, args);
            if (_this.settings.get(message.author.id)) {
                const localEdit = _this.settings.get(message.author.id);
                const currentNickname = result.props.children;
                result.props.children =
                    React.createElement(React.Fragment, null, [
                        React.createElement("span", {
                            style: isAValidColor(localEdit.color) ? { color: localEdit.color } : result.props.style
                        }, localEdit.nickname || currentNickname),
                        React.createElement("span", { style: result.props.style }, currentNickname)
                    ]);
                result.props.className = (result.props.className ? result.props.className : "") + " has-local-nickname";
            }
            return result;
        };
        return res;
    }

    privateChannelPatch(_, res) {
        if (_this.settings.get(this.props.user.id)) {
            const localEdit = _this.settings.get(this.props.user.id);
            res.props.name.props.children = React.createElement(React.Fragment, null, [
                React.createElement("span", {
                    style: isAValidColor(localEdit.color) ? { color: localEdit.color } : {}
                }, localEdit.nickname || this.props.user.username),
                React.createElement("span", null, this.props.user.username)
            ]);
            res.props.name.props.className = (res.props.name.props.className ? res.props.name.props.className : "") + " dm-channel has-local-nickname";
        }
        return res;
    }

    memberListItemPatch(_, res) {
        if (!this.props.user) return res;
        if (_this.settings.get(this.props.user.id)) {
            const localEdit = _this.settings.get(this.props.user.id);
            res.props.name.props.children = React.createElement(React.Fragment, null, [
                React.createElement("span", {
                    style: isAValidColor(localEdit.color) ? { color: localEdit.color } : res.props.name.props.style
                }, localEdit.nickname || (this.props.nick || this.props.user.username)),
                React.createElement("span", { style: res.props.name.props.style }, (this.props.nick || this.props.user.username))
            ]);
            res.props.name.props.className = (res.props.name.props.className ? res.props.name.props.className : "") + " has-local-nickname";
        }
        return res;
    }

    discordTagPatch(args, res) {
        if (!_this.settings.get(args[0].user.id)) return res;
        const localEdit = _this.settings.get(args[0].user.id);

        const originalType = res.type;

        res.type = function (props) {
            const res = originalType(props);
            res.props.children[0].props.children = React.createElement("span", { className: "discord-tag has-local-nickname" }, [
                React.createElement("span", {
                    style: isAValidColor(localEdit.color) ? { color: localEdit.color } : {}
                }, localEdit.nickname || props.name),
                React.createElement("span", null, props.name)
            ]);
            return res;
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
                    _this.modalStack.push(EditModal, {
                        username: user.username,
                        defaults: localEdit,
                        close: (state) => {
                            if (state == {} || (state.nickname == "" && !isAValidColor(state.color))) _this.settings.delete(user.id);
                            else _this.settings.set(user.id, state);
                            _this.modalStack.popWithKey("local-nicknames-modal");
                        }
                    }, "local-nicknames-modal");
                }
            }),
            (localEdit.nickname || isAValidColor(localEdit.color)) ? React.createElement(MenuItem, {
                id: "local-nicknames-reset",
                label: "Reset Local Nickname",
                action: () => { _this.settings.delete(user.id); }
            }) : null
        ]);

        const groups = res.props.children.props.children;

        const devGroup = groups.find(c => c && c.props && c.props.children && c.props.children.props && c.props.children.props.id == "devmode-copy-id");

        if (devGroup) {
            groups.splice(groups.indexOf(devGroup), 0, customGroup);
        } else {
            groups.push(customGroup);
        }

        return res;
    }
};
