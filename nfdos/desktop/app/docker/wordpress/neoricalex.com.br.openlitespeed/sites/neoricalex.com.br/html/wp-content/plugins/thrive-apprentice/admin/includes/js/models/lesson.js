const CourseItem = require( './course/item' );
const VideoModel = require( './media' );
/**
 * If a lesson is types as audio then it uses this model to
 * - set props for audio
 * @type {jQuery|void}
 */
const AudioModel = require( './media' ).extend( {
	/**
	 * @property {Object} default props
	 */
	defaults: {
		options: [],
		source: '',
		type: 'soundcloud'
	}
} );
/**
 * Lesson Model
 * @type {Backbone.Model}
 */
module.exports = CourseItem.extend( {
	/**
	 * @property defaults props for lesson model
	 */
	defaults: {
		comment_status: 'closed',
		post_excerpt: '',
		post_type: 'tva_lesson',
		order: 0,
		cover_image: '',
		lesson_type: 'text'
	},
	/**
	 * Initialize some defaults on lesson model
	 * @param {Object} options
	 */
	initialize: function ( options = {} ) {
		this.set( {
			'video': new VideoModel( options.video ),
			'audio': new AudioModel( options.audio )
		} );
	},
	/**
	 * Validates lesson model
	 * @return {undefined|[]}
	 * - undefined if the model is valid
	 * - array of errors if it's not
	 */
	validate: function ( data = {} ) {

		let errors = [];

		const audioErrors = data.audio.validate( data.audio.attributes );
		const videoErrors = data.video.validate( data.video.attributes );

		if ( ! data.post_title ) {
			errors.push( this.validation_error( 'post_title', TVA.t.EmptyTitle ) );
		}

		if ( data.lesson_type === 'audio' && audioErrors && audioErrors.length ) {
			data.audio.trigger( 'invalid', data.audio, audioErrors );
			errors = [ ...errors, ...audioErrors ];
		}

		if ( data.lesson_type === 'video' && videoErrors && videoErrors.length ) {
			data.video.trigger( 'invalid', data.video, videoErrors );
			errors = [ ...errors, ...videoErrors ];
		}

		if ( errors.length ) {
			return errors;
		}
	},
	/**
	 * Parses data from server and sets some prop on model
	 * @param {Object} data
	 */
	parse: function ( data = {} ) {
		data.video = new VideoModel( data.video );
		data.audio = new AudioModel( data.audio );

		return data;
	},
	/**
	 * Returns the URL where the item should be saved
	 * @return {string}
	 */
	url: function () {

		return TVA.apiSettings.root + TVA.apiSettings.v2 + `/lessons/${this.get( 'id' ) ? this.get( 'id' ) : ''}`;
	}
} );
