const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const FixStyleOnlyEntriesPlugin = require( 'webpack-fix-style-only-entries' );
const wpPot = require( 'wp-pot' );

function isProduction() {
	return process.env.NODE_ENV === 'production';
}

function envName( extension = 'js' ) {
	return `[name].${isProduction() ? 'min.' : ''}${extension}`;
}

if ( isProduction() ) {
	wpPot( {
		destFile: 'languages/thrive-apprentice.po',
		package: 'Thrive Apprentice',
		src: [
			'inc/classes/*.php',
			'inc/**/*.phtml',
			'admin/**/*.phtml',
			'admin/**/*.phtml',
			'tcb-bridge/**/*.php',
			'templates/**/*.php'
		]
	} )
}

const maybeDevtool = isProduction() ? {} : {
	/**
	 * Needed for CSS source maps to work.
	 */
	devtool: 'cheap-module-source-map',
};

const webpackConfig = {
	/**
	 * NODE_ENV variable is passed when running webpack. See package.json -> "scripts" field
	 */
	mode: process.env.NODE_ENV,
	...maybeDevtool,
	/**
	 * https://webpack.js.org/concepts/entry-points/
	 * Object key = file path without extension
	 * value = array of source files (or a string with a single source file)
	 * supports both js and scss
	 */
	entry: {
		'js/dist/editor': './js/editor.js',
		'js/dist/jquery.scrollbar': './js/jquery.scrollbar.js',
		'admin/includes/dist/apprentice': './admin/includes/js/main.js',
		'admin/includes/dist/nav-menu': './admin/includes/js/nav-menu.js',
		'js/dist/frontend': './js/frontend.js',
		'tcb-bridge/assets/js/tva-tcb-external': './tcb-bridge/assets/js/external/main.js',
		'tcb-bridge/assets/js/tva-tcb-internal': './tcb-bridge/assets/js/internal/main.js',
		'tcb-bridge/assets/js/tva-tcb-frontend': './tcb-bridge/assets/js/frontend/editor.js',
		'js/dist/tva-menu-item-messages': './js/tva-menu-item-messages.js',
		'js/dist/url-formatting': './js/url-formatting.js',

		/**
		 * scss
		 */
		'admin/includes/dist/tva-admin-styles': './admin/includes/scss/main.scss',
		'tcb-bridge/assets/css/main_frame': './tcb-bridge/assets/sass/main_frame.scss',
		'tcb-bridge/assets/css/architect_main_frame': './tcb-bridge/assets/sass/architect_main_frame.scss',
		'tcb-bridge/assets/css/style': './tcb-bridge/assets/sass/style.scss',
		'css/styles': './css/sass/styles.scss',
		'css/checkout': './css/sass/checkout.scss',
		'css/logout_message': './css/sass/logout_message.scss',
	},
	/**
	 * Output specification - it just needs the main path (`path` field).
	 * The keys from `entry` are all relative to the `path` field
	 */
	output: {
		/**
		 * filename is [name].js for dev, and [name].min.js for production.
		 * CSS file names are controlled from the `MiniCssExtractPlugin` plugin (see `plugins` entry)
		 */
		filename: envName(),
		path: __dirname,
	},
	/**
	 * https://webpack.js.org/configuration/externals/
	 * The externals configuration option provides a way of excluding dependencies from the output bundles.
	 * Instead, the created bundle relies on that dependency to be present in the consumer's (any end-user application) environment.
	 * This feature is typically most useful to library developers, however there are a variety of applications for it.
	 *
	 * TYPE
	 * string [string] object function RegExp
	 */
	externals: {
		jquery: 'jQuery',
	},
	module: {
		rules: [
			/**
			 * SCSS files processing
			 */
			{
				test: /\.scss$/,
				/**
				 * The loaders are run in reverse order
				 */
				use: [
					/**
					 * Step 3. Extract CSS-in-JS to external CSS files
					 *
					 * https://webpack.js.org/plugins/mini-css-extract-plugin/
					 */
					MiniCssExtractPlugin.loader,
					/**
					 * Step 2. CSS-loader used to get output from SASS-loader and pass it over to MiniCssExtractPlugin
					 *
					 * https://webpack.js.org/loaders/css-loader/
					 */
					{
						loader: 'css-loader',
						options: {
							url: false, // this makes sure that css-loader does not try to process url()s
						}
					},
					/**
					 * Step 1. Process scss files using dart-sass
					 *
					 * https://webpack.js.org/loaders/sass-loader/
					 */
					{
						loader: 'sass-loader',
						options: {
							sassOptions: require( 'node-bourbon' ),
						}
					},
				],
			},
			/**
			 * Babel configuration
			 * https://webpack.js.org/loaders/babel-loader/
			 */
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				use: {
					loader: 'babel-loader',
					options: {
						/**
						 * Used to increase the speed of `babelifying`
						 */
						cacheDirectory: true,
						/**
						 * https://babeljs.io/docs/en/babel-preset-env
						 * Integrates with browserlist and intelligently knows what to transform in order to support all browsers
						 *
						 * browserlist definition is located in package.json
						 */
						presets: [ '@babel/preset-env' ],
						plugins: [
							/**
							 * Allow obj = { ...obj1, ...obj2 }
							 */
							'@babel/plugin-proposal-object-rest-spread',

							/**
							 * Allows obj.field1?.field2?.field3
							 */
							'@babel/plugin-proposal-optional-chaining',

							/**
							 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator
							 *
							 */
							'@babel/plugin-proposal-nullish-coalescing-operator',
						]
					}
				}
			}
		],
	},
	plugins: [
		/**
		 * This plugin fixes an issue in webpack. Webpack will always generate an empty js file for each css file.
		 * This plugin removes that js file.
		 */
		new FixStyleOnlyEntriesPlugin(),
		/**
		 * Needed to extract css in external files.
		 */
		new MiniCssExtractPlugin( {
			filename: '[name].css',
		} ),
	],
};

module.exports = webpackConfig;
