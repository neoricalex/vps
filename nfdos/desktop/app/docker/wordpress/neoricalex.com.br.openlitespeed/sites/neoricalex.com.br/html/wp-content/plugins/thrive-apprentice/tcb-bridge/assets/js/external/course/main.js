/* initialize what we need for the course implementation */

const hookFiles = {
		general: require( './hooks/general' ),
		css: require( './hooks/css' ),
		sync: require( './hooks/sync' ),
		shortcodes: require( './hooks/inline-shortcodes' ),
		cloud: require( './hooks/cloud' ),
		links: require( './hooks/dynamic-links' ),
		drag: require( './hooks/drag' ),
	},
	priorities = {
		'tcb_head_css_prefix': 9,
	};

/* For each file that contains hooks, add the actions and filters. If a custom priority is set, use that instead of the default '10'. */
_.each( hookFiles, file => {
	TVE.addHooks( file, priorities );
} );
