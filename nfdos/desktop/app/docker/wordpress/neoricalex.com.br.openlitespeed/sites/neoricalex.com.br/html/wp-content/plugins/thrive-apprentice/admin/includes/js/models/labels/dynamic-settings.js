const Base = require( '../base' );
const Label = require( '../label' );

/**
 * A special case of label applicable in various user contexts
 */
const UserContextLabel = Label.extend( {

	savedMessage: TVA.t.settingsSaved,

	save() {
		return this.settings.save();
	},

	defaults() {
		return {
			...Label.prototype.defaults.call( this ),
			opt: 'show',
		};
	},
	/**
	 * Make sure only needed fields are stored.
	 */
	toJSON() {
		return this.pick( Object.keys( this.defaults() ) );
	}
} );

/**
 * Model to be used for Call To Action button labels
 */
const CTAButton = UserContextLabel.extend( {
	/**
	 * Currently the only need property is `title`
	 *
	 * @return {{title: string}}
	 */
	defaults() {
		return {
			title: '',
		};
	}
} );

const DynamicSettings = Base.extend( {
	initialize( attr ) {
		this.set( 'labels', this.initLabels( attr.labels || {} ) );
		this.set( 'buttons', this.initCTALabels( attr.buttons || {} ) );
	},

	/**
	 * Init or reset data on each label instance
	 *
	 * @param labelData
	 * @return {{}}
	 */
	initLabels( labelData ) {
		const labels = {};
		const existing = this.get( 'labels' ) || {};
		_.each( labelData || {}, ( item, key ) => {
			labels[ key ] = existing[ key ] instanceof UserContextLabel ? existing[ key ] : new UserContextLabel();
			labels[ key ].set( item, {silent: true} );
			labels[ key ].settings = this; // stores a reference to the main settings model
		} );

		return labels;
	},

	/**
	 * Init or reset data on each CTA label instance
	 *
	 * @param labelData
	 * @return {{}}
	 */
	initCTALabels( labelData ) {
		const labels = {};
		const existing = this.get( 'buttons' ) || {};
		_.each( labelData || {}, ( item, key ) => {
			labels[ key ] = existing[ key ] instanceof CTAButton ? existing[ key ] : new CTAButton();
			labels[ key ].set( item, {silent: true} );
			labels[ key ].settings = this; // stores a reference to the main settings model
		} );

		return labels;
	},

	/**
	 * Get the Label instance applicable to the context identified by key
	 *
	 * @param key
	 * @return {*}
	 */
	getUserContextLabel( key ) {
		return this.get( 'labels' )[ key ];
	},

	/**
	 * Get the CTA button label for `key`
	 *
	 * @param key
	 * @return {*}
	 */
	getCTAButtonLabel( key ) {
		return this.get( 'buttons' )[ key ];
	},

	parse( response ) {
		response.labels = this.initLabels( response.labels );
	},

	/**
	 * Overwritten so that labels are also converted to json
	 *
	 * @return {{[p: string]: *}}
	 */
	toJSON() {
		return {
			...Base.prototype.toJSON.call( this ),
			switch_labels: this.get( 'switch_labels' ),
			labels: _.mapObject( this.get( 'labels' ), label => label.toJSON() )
		};
	},

	/**
	 * Get the ajax URL for saving the settings
	 */
	url() {
		return TVA.routes.labels + '/dynamic-settings';
	}
} );

/**
 * Export a singleton model
 */
module.exports = new DynamicSettings( TVA.dynamicLabelSetup.settings );
