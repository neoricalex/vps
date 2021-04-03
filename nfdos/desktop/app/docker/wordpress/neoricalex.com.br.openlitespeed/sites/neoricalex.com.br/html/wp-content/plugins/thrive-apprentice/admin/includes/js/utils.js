window.tinymce = window.tinymce || undefined;
window.tinyMCEPreInit = window.tinyMCEPreInit || undefined;
( function ( $ ) {
	module.exports = {
		/**
		 * Return an icon html from svg template
		 *
		 * @param icon
		 * @param {string} [namespace] optional 'tva-'
		 *
		 * @returns {string}
		 */
		icon: function ( icon, namespace = 'ta-' ) {
			if ( ! icon ) {
				return '';
			}

			return TVE_Dash.tpl( 'utils/icon', {icon: namespace + icon} );
		},
		/**
		 * Check if email is valid
		 *
		 * @param {string} email
		 *
		 * @returns {boolean}
		 */
		isEmail: function ( email ) {
			var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

			return re.test( String( email ).toLowerCase() );
		},

		/**
		 * Initialize TinyMCE on a textarea
		 * @param {string|Array} id of textarea
		 * @param {Backbone.Model} model
		 * @param {string} prop to be updated on change
		 *
		 * @return {Promise} promise that resolves when the editor has been initialized
		 */
		renderMCE: function ( id, model, prop ) {
			return new Promise( resolve => {
				setTimeout( () => {
					this.clearMCEEditor( id );
					this.editorInit( id, model, prop ).then( editors => resolve( editors[ 0 ] ) );
				} );
			} );
		},

		/**
		 * Inits TinyMCE on a textarea
		 * @param {string} id of textarea
		 * @param {Backbone.Model} model
		 * @param {string} prop to be updated on change
		 */
		editorInit: function ( id, model, prop ) {

			if ( typeof tinymce === 'undefined' || ! tinymce ) {
				return Promise.resolve( null ); // no tinymce available => resolve instantly
			}

			const mce_reinit = this.buildMCEInit( {
				mce: window.tinyMCEPreInit.mceInit[ 'tve_tinymce_tpl' ],
				qt: window.tinyMCEPreInit.qtInit[ 'tve_tinymce_tpl' ]
			}, id );

			window.tinyMCEPreInit.mceInit = $.extend( tinyMCEPreInit.mceInit, mce_reinit.mce_init );
			window.tinyMCEPreInit.mceInit[ id ].setup = function ( editor ) {
				editor.on( 'init', function () {
					editor.setContent( model.get( prop ) );
				} );
				editor.on( 'change', function ( e ) {
					var value = tinymce.get( id );

					model.set( prop, value.getContent() );

				} );
				editor.on( 'blur', function ( e ) {
					const value = window.tinymce.get( id );

					if ( model.get( prop ) !== value.getContent() ) {
						model.set( prop, value.getContent() );
					}

					model.trigger( 'tva_tinymce_blur' );
				} );
			};

			return window.tinymce.init( tinyMCEPreInit.mceInit[ id ] );
		},

		/**
		 * Destroys the tinyMCE on the editor elements/selector
		 * @param {string|Array} editor
		 * @param ignore
		 */
		clearMCEEditor: function ( editor, ignore ) {

			if ( typeof window.tinymce === 'undefined' || ! tinymce ) {
				return;
			}

			function destroy( element ) {
				try {
					const _current = window.tinymce.get( element );
					_current.destroy();
					window.tinymce.execCommand( 'mceRemoveControl', true, element )
				} catch ( e ) {
				}
			}

			if ( typeof editor === 'string' ) {
				editor = [ editor ];
			}

			editor.forEach( function ( element ) {
				if ( ignore !== element ) {
					destroy( element );
				}
			} );
		},

		buildMCEInit: function ( defaults, _id ) {

			const mce = {}, qt = {};
			mce[ _id ] = jQuery.extend( true, {}, defaults.mce );
			qt[ _id ] = jQuery.extend( true, {}, defaults.qt );

			qt[ _id ].id = _id;

			mce[ _id ].selector = '#' + _id;
			mce[ _id ].body_class = mce[ _id ].body_class.replace( 'tve_tinymce_tpl', _id );

			return {
				'mce_init': mce,
				'qt_init': qt
			};
		},

		/**
		 * Open WP Media and on select and image set attachment's URL on model's prop
		 * @param {Object} options
		 * @param {Backbone.Model} model
		 * @param {string} prop
		 */
		wpMedia: function ( options = {}, model, prop ) {

			const _defaults = {
				title: 'Select or upload an image',
				button: {
					text: 'Use this Image'
				},
				library: {type: 'image'},
				multiple: false
			};

			const frame = wp.media( $.extend( _defaults, options ) );

			frame.on( 'select', options.select || ( () => {
				const attachment = frame.state().get( 'selection' ).first().toJSON();
				model.set( prop, attachment.url );
			} ) );

			frame.open();
		},

		/**
		 * rebind the wistia listeners
		 */
		rebindWistiaFancyBoxes: function () {

			if ( window.rebindWistiaFancyBoxes ) {
				window.rebindWistiaFancyBoxes();
			}
		},
		/**
		 * Pluck multiple fields from a collection or an array
		 * Returns an array of objects containing those fields.
		 *
		 * @param {Array|Backbone.Collection} list list of items
		 * @param {Array} attributes
		 *
		 * @return {Object[]}
		 */
		pluckFields( list, attributes ) {
			/**
			 * Get the attribute values from a model
			 *
			 * @param {Backbone.Model} model model instance
			 * @param {Array} attr array of attributes to retrieve
			 *
			 * @return {{}}
			 */
			const getter = ( model, attr ) => {
				const data = {};

				attr.forEach( attribute => data[ attribute ] = model instanceof Backbone.Model ? model.get( attribute ) : model[ attribute ] );

				return data;
			};

			if ( list instanceof Backbone.Collection ) {
				list = list.toJSON();
			}

			return list.map( item => getter( item, attributes ) );
		},

		/**
		 * Upper-case the first letter of a string
		 *
		 * @param {String} str
		 *
		 * @return {String}
		 */
		ucFirst( str ) {
			return str.charAt( 0 ).toUpperCase() + str.substring( 1 );
		},

		/**
		 * Get the singular or plural form of a translation based on `count`
		 *
		 * @param {Number} count
		 * @param {String} singularTranslationKey
		 * @param {String} [pluralTranslationKey]
		 * @param {Boolean} [includeCount] whether or not to include the number at the beginning
		 *
		 * @return {string}
		 */
		_n( count, singularTranslationKey, pluralTranslationKey = singularTranslationKey + 's', includeCount = true ) {
			return ( includeCount ? count + ' ' : '' ) + TVA.t[ count === 1 ? singularTranslationKey : pluralTranslationKey ];
		},

		/**
		 * Computes the Preview URL
		 *
		 * @returns {string|any}
		 */
		getPreviewUrl: function () {
			const firstPublishCourse = TVA.courses.findWhere( {status: 'publish'} );

			if ( TVA.settings.preview_option.value && firstPublishCourse ) {
				return firstPublishCourse.get( 'preview_url' );
			} else if ( Array.isArray( TVA.design.demo_courses ) && TVA.design.demo_courses.length > 0 ) {
				return TVA.design.demo_courses[ 0 ].preview_url;
			}

			return TVA.courses.first() ? TVA.courses.first().get( 'preview_url' ) : '';
		}
	};
} )( jQuery );
