const RulesCollection = require( './../collections/rules' );
const TopicModel = require( './topic' );
const VideoModel = require( './media' );

/**
 * Specific model for Course
 */
module.exports = require( './base' ).extend( {
	/**
	 * @property {string}
	 */
	idAttribute: 'id',
	defaults: {
		topic: 0,
		level: 0,
		label: 0,
		message: TVA.t.NotLoggedIn,
		description: '',
		allows_comments: TVA.settings.comment_status.value === 'open',
	},
	/**
	 * Accepts id as parameter and fetches the model from DB
	 * @param {Object|number} options
	 */
	initialize: function ( options ) {

		this.set( 'author', new Backbone.Model( options && options.author || TVA.defaultAuthor ) );

		if ( typeof options !== 'object' ) {
			const id = parseInt( options );
			if ( isNaN( id ) ) {

				this.set( {
					video: new VideoModel( {
						options: [],
						source: '',
						type: 'youtube'
					} ),
					allows_comments: TVA.settings.comment_status.value === 'open',
					has_video: false,
					excluded: 0,
					rules: new RulesCollection(),
					order: TVA.courses.newItemOrder()
				} );

				return;
			}
			this.set( 'id', id );
			this.fetch( {
				success: () => {
					this.set( 'fetched', true, {silent: true} ); //flag for not fetching it again
					this.fetchedWithSuccess.apply( this, arguments );
					this.saveState();
				},
				error: () => {
					this.fetchedWithError.apply( this, arguments );
				}
			} );
		} else { //if the model is initialized with data prop
			this.set( 'rules', new RulesCollection( options.rules || [] ) );
		}
	},
	/**
	 * Defines the URL for the server model
	 * @return {string}
	 */
	url: function () {
		return TVA.apiSettings.root + TVA.apiSettings.v2 + `/courses/${this.get( 'id' ) ? this.get( 'id' ) : ''}`;
	},
	/**
	 * Parses the model from the server and sets the properties to current model
	 * @param {Object} data
	 * @return {Object}
	 */
	parse: function ( data = {} ) {

		data.video = this.get( 'video' ) instanceof VideoModel ? this.get( 'video' ) : new VideoModel( data.video );
		data.author = this.get( 'author' ) instanceof Backbone.Model ? this.get( 'author' ).set( data.author || {} ) : new Backbone.Model( data.author || {} );
		data.rules = this.get( 'rules' ) instanceof RulesCollection ? this.get( 'rules' ) : new RulesCollection( data.rules || [] );

		return data
	},
	/**
	 * Called on success fetch
	 * - triggers {tva.course.fetch.success} event
	 */
	fetchedWithSuccess: function () {
		this.trigger( 'tva.course.fetch.success', this );
	},
	/**
	 * Called on failure fetch
	 * - triggers {tva.course.fetch.error} event
	 */
	fetchedWithError: function () {
		this.trigger( 'tva.course.fetch.error', this );
	},
	/**
	 * Validate the course model before sending it to server to be saved in DB
	 * @param {Object} data
	 * @return {[]|undefined}
	 */
	validate: function ( data ) {

		let errors = [];

		if ( ! data.name ) {
			errors.push( this.validation_error( 'name', TVA.t.InvalidName ) );
		}

		if ( data.has_video && data.video instanceof VideoModel ) {
			const videoErrors = data.video.validate( data.video.attributes );
			if ( videoErrors ) {
				data.video.trigger( 'invalid', data.video, videoErrors );
				errors = [ ...errors, ...videoErrors ];
			}
		}

		if ( errors.length ) {
			return errors;
		}

		if ( ! data.description ) {
			return TVA.t.InvalidDescription;
		}

		/**
		 * if private make sure there are some rules set
		 */
		if ( data.is_private && data.rules.hasEmptyRules() ) {
			return TVA.t.rule.errors.no_rule_set;
		}
	},

	/**
	 * Checks if a set of rules has SendOwl Integration
	 *
	 * @returns {boolean}
	 */
	hasSendOwlIntegration: function () {
		const rules = this.get( 'rules' );

		if ( rules instanceof RulesCollection ) {
			return rules.hasIntegration( 'sendowl_product' ) || rules.hasIntegration( 'sendowl_bundle' );
		}

		if ( Array.isArray( rules ) ) {
			return rules.filter( rule => [ 'sendowl_product', 'sendowl_bundle' ].includes( rule.integration ) ).length;
		}

		return false;
	},

	/**
	 * Checks if a set of rules contains ThriveCart Rule
	 *
	 * @returns {boolean}
	 */
	hasThriveCartIntegration: function () {
		const rules = this.get( 'rules' );

		if ( rules instanceof RulesCollection ) {
			return rules.hasIntegration( 'thrivecart' );
		}

		if ( Array.isArray( rules ) ) {
			return rules.filter( rule => [ 'thrivecart' ].includes( rule.integration ) ).length;
		}

		return false;
	},
	/**
	 * Gets topic model
	 *
	 * @return {TopicModel}
	 */
	getTopic: function () {
		return new TopicModel( TVA.topics.findById( this.get( 'topic' ) ).toJSON() );
	},
	/**
	 * Gets count of lessons of this course suffixed by lesson label
	 * @return {string}
	 */
	getCountedLessons: function () {
		return TVA.Utils._n( this.get( 'count_lessons' ), 'Lesson' );
	},
	/**
	 * Re-calculates the count of lessons based on the structure
	 */
	recountLessons() {
		const structure = this.get( 'structure' );
		if ( structure && structure instanceof Backbone.Collection ) {
			this.set( 'count_lessons', structure.findItemsByOptions( {post_type: 'tva_lesson'} ).length, {silent: true} );
			this.saveState();
		}
	},
	/**
	 * Whether or not this course has modules
	 *
	 * @return {Boolean}
	 */
	hasModules() {
		const structure = this.get( 'structure' );
		if ( ! structure ) {
			return false;
		}

		let item;
		if ( structure instanceof Backbone.Collection ) {
			item = structure.at( 0 );
		} else {
			item = structure[ 0 ];
		}

		if ( ! item ) {
			return false;
		}

		if ( item instanceof Backbone.Model ) {
			return item.getType() === 'module';
		}

		return item.post_type === 'tva_module';
	}
} );
