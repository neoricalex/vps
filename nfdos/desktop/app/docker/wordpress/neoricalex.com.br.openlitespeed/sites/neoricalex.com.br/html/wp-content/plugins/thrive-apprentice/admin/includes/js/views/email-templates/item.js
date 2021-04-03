( function ( $ ) {
	const base = require( '../base' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'settings/email-template-item' ),
		triggerTpl: TVE_Dash.tpl( 'settings/email-template-trigger' ),
		initialize: function () {
			base.prototype.initialize.apply( this, arguments );

			this.emailShortcodesCollection = new Backbone.Collection( Object.values( TVA.emailShortcodes ) );
			this.emailTriggersCollection = new Backbone.Collection( Object.values( TVA.emailTriggers ) );
		},
		/**
		 * After render function
		 */
		afterRender: function () {
			this.$emailShortcodes = this.$( '#tva-email-shortcodes' );
			this.$emailTriggers = this.$( '#tva-email-triggers-wrapper' );
			this.$emailBodyTextarea = this.$( '#tva-email-body' );
			this.$saveButton = this.$( '.tva-email-template-save' );

			this.emailBodyCodeEditor = this._configureCodeEditor();

			//Append Email Shortcodes
			this.emailShortcodesCollection.each( shortcode => {
				this.$emailShortcodes.append(
					$( '<option/>' )
						.text( shortcode.get( 'label' ) )
						.val( shortcode.get( 'slug' ) )
				);
			} );

			//render email triggers
			this.emailTriggersCollection.each( trigger => {
				this.$emailTriggers.append( this.triggerTpl( {
					model: trigger,
					checked: this.model.get( 'triggers' ).includes( trigger.get( 'slug' ) )
				} ) );
			} );

			setTimeout( () => {
				this.emailBodyCodeEditor.refresh();
				this.emailBodyCodeEditor.setCursor( this.emailBodyCodeEditor.lineCount(), 0 );// Set the cursor at the end of existing content
				this.emailBodyCodeEditor.focus();
			} );
		},

		/**
		 * Called when user changes a field
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		changeField: function ( event, dom ) {
			const field = dom.getAttribute( 'data-field' ),
				props = {};

			props[ field ] = dom.value;

			this.model.set( props );
		},

		/**
		 * Saves Triggers
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		saveTrigger: function ( event, dom ) {

			const triggers = [];

			this.$( '.tva-email-trigger:checked' ).each( ( index, element ) => {
				triggers.push( element.getAttribute( 'name' ) );
			} );

			this.model.set( 'triggers', triggers );
		},

		/**
		 * Called when user clicks "Insert Shortcode" button
		 *
		 * @param {Event} event
		 * @param {HTMLAnchorElement} dom
		 */
		insertShortcode: function ( event, dom ) {
			const shortcode = this.emailShortcodesCollection.findWhere( {slug: this.$emailShortcodes.val()} );

			if ( shortcode ) {
				this._insertCodeEditorText( shortcode.get( 'text' ) );
			}
		},

		/**
		 * Save model
		 *
		 * @param {Event} event
		 * @param {HTMLButtonElement} dom
		 */
		save: function ( event, dom ) {

			TVE_Dash.showLoader();
			this.$saveButton.attr( 'disabled', 'true' );

			this.model.save( null, {
				success: function () {
					TVE_Dash.success( TVA.t.template_saved );
				},
				error: ( model, response ) => {
					TVE_Dash.err( response.responseJSON.message );
				},
				complete: response => {
					this.$saveButton.removeAttr( 'disabled' );
					TVE_Dash.hideLoader();
				}
			} );
		},

		/**
		 * Inserts text at the cursor position
		 *
		 * @param {string} text
		 *
		 * @private
		 */
		_insertCodeEditorText: function ( text ) {

			const doc = this.emailBodyCodeEditor.getDoc(),
				cursor = doc.getCursor();

			doc.replaceRange( text, cursor );
		},

		/**
		 * Configure CodeMirror Editor
		 *
		 * @returns {Object}
		 *
		 * @private
		 */
		_configureCodeEditor: function () {
			let editorSettings = wp.codeEditor.defaultSettings ? _.clone( wp.codeEditor.defaultSettings ) : {},
				editor;
			editorSettings.codemirror = _.extend(
				{},
				editorSettings.codemirror,
				{
					lineNumbers: true,
					mode: 'text',
					indentUnit: 2,
					tabSize: 2,
					lineWrapping: true,
				}
			);

			editor = wp.codeEditor.initialize( this.$emailBodyTextarea, editorSettings );
			editor.codemirror.setSize( '100%', '300px' );

			/**
			 * On Code Mirror Change, parse the Customer List Array
			 */
			editor.codemirror.on( 'change', ( codeMirrorInstance, changedObj ) => {
				this.model.set( 'body', codeMirrorInstance.getValue() );
			} );

			return editor.codemirror;
		},
	} );
} )( jQuery );
