const { Tooltip } = require("powercord/components");
const { React } = require("powercord/webpack");

module.exports = function (props) {
	const { reverse, hover, original, changed } = props;

	const changedSpan = (
		<span
			style={
				changed.color !== "default"
					? { color: changed.color }
					: original.style
			}
		>
			{changed.nickname || original.nickname}
		</span>
	);
	const originalSpan = (
		<span style={original.style}>{original.nickname}</span>
	);

	if (hover) {
		return (
			<Tooltip
				text={reverse ? changedSpan : originalSpan}
				position="bottom"
				className="tooltip-nickname"
			>
				{reverse ? originalSpan : changedSpan}
			</Tooltip>
		);
	}

	return <>{changedSpan}</>;
};
