const { Tooltip } = require("powercord/components");
const { React } = require("powercord/webpack");

module.exports = function (props) {
    const { reverted, tooltip, hover, original, changed, isAValidColor } = props;

    const changedSpan = <span style={isAValidColor(changed.color) ? { color: changed.color } : original.style}>{changed.nickname || original.nickname}</span>;
    const originalSpan = <span style={original.style}>{original.nickname}</span>;

    if (tooltip) {
        return <Tooltip
            text={reverted ? changedSpan : originalSpan}
            position="bottom"
            className="tooltip-nickname"
        >
            {reverted ? originalSpan : changedSpan}
        </Tooltip>;
    }

    return <>
        {reverted ? originalSpan : changedSpan}
        {hover ? (reverted ? changedSpan : originalSpan) : null}
    </>;
};