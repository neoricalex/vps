( function ( $ ) {

	const BaseView = require( './../base' );
	const DropDownView = require( './../select' );
	const IntegrationView = require( './integration' );
	const ThriveCartIntegrationView = require( './thrivcart-integration' );
	const AccessIntegrations = require( './../../collections/access-integrations' );
	const SelectCollection = require( '../../collections/select' );
	const LabelModel = require( '../../models/label' );

	/**
	 * {{Backbone.View}} for choosing a course restriction label
	 */
	const LabelsDropdownView = DropDownView.extend( {
		renderThumbs: true,
		label: '',
		initialize( options ) {
			const collection = new SelectCollection( TVA.labels.toJSON() );
			collection.idAttribute = 'ID';
			this.collection = collection;

			return DropDownView.prototype.initialize.call( this, {collection, ...options} );
		}
	} );

	/**
	 * View which handles logic for
	 * access restrictions course tab
	 * @type {Backbone.View}
	 */
	module.exports = BaseView.extend( {
		/**
		 * Underscore template
		 */
		template: TVE_Dash.tpl( 'courses/access-tab' ),
		/**
		 * @property {Backbone.Collection}
		 */
		integrations: null,
		/**
		 * @property {Array} of integrations views
		 */
		integrationsViews: [],
		/**
		 * @property {jQuery} wrapper when integrations are rendered
		 */
		$integrationsWrapper: null,
		/**
		 * @property {jQuery}
		 */
		$rulesCountMessage: null,
		/**
		 * @property {DropDownView}
		 */
		labelDropdown: null,
		/**
		 * View Constructor
		 *
		 * @param {Object} options
		 */
		initialize: function ( options ) {
			$.extend( true, this, options );

			this.integrations = new AccessIntegrations( TVA.access_integrations );
			this.labelDropdown = new LabelsDropdownView( {
				/**
				 * Enable the "Add new item" section
				 */
				add_item: {
					str: {
						title: TVA.t.addNewLabel,
						save: TVA.t.saveLabel,
					},
					inputTemplate: TVE_Dash.tpl( 'labels/add-inline' ),
					/**
					 * Spectrum colorpicker
					 *
					 * @return {Boolean}
					 */
					spectrum( event ) {
						const self = this;
						const thumb = event.currentTarget;
						const $input = $( thumb ).find( 'input' ).spectrum( {
							containerClassName: 'tva-color-picker',
							showPalette: false,
							allowEmpty: false,
							showInitial: false,
							showButtons: true,
							chooseText: 'Apply',
							cancelText: 'Cancel',
							showInput: true,
							preferredFormat: 'hex',
							hide( color ) {
								thumb.style.setProperty( '--thumb-color', color.toString() );
								self.focusInput();
							}
						} );

						/* show it on the next animation frame */
						requestAnimationFrame( () => $input.spectrum( 'show' ) );

						return false;
					},
					/**
					 * Instantiate a new LabelModel and return it
					 *
					 * @return {*}
					 */
					getModelForSave() {
						const color = this.$( '.tva-colorpicker' ).val();

						return new LabelModel( {
							title: this.$input.val(),
							label_color: color,
							color,
						} );
					},
					afterSave( response, model ) {
						TVA.labels.push( response ); // add it to the global labels collection
					},
					addToCollection( response ) {
						this.dropdown.collection.push( response );
					},
				}
			} );
			/*
			 * if a model in collection is selected
			 * then set it on course model and save the course
			 */
			this.labelDropdown.on( 'tva.dropdown.item.selected', this.onLabelChange.bind( this ) );
			this.listenTo( this.model.get( 'rules' ), 'add', this.renderRulesCount );
			this.listenTo( this.model.get( 'rules' ), 'remove', this.renderRulesCount );

			this.listenTo( this.model, 'change', this.changeModel );
			this.listenTo( this.model, 'change:is_private', model => this.togglePrivateContent( model.get( 'is_private' ) ) );
		},

		/**
		 * Apply some logic on the HTML which has been rendered
		 * on view's element
		 */
		afterRender: function () {

			this.$( '#tva-course-is-private' ).prop( 'checked', this.model.get( 'is_private' ) );
			this.$integrationsWrapper = this.$( '#tva-course-integrations-wrapper' );
			this.$rulesCountMessage = this.$( '#tva-rules-count-message' );
			this.$privateContent = this.$( '.tva-restrictions-card-state' );
			this.$restrictionsExclude = this.$( '.tva-restrictions-exclude' );

			this.renderLabelDropdown();
			this.togglePrivateContent( this.model.get( 'is_private' ) );

			TVA.Utils.renderMCE( 'tva-course-message', this.model, 'message' );

			TVE_Dash.data_binder( this );
		},
		/**
		 * Counts available rules and renders their count
		 */
		renderRulesCount: function () {

			const validRules = this.model.get( 'rules' ).filter( ( model ) => {
				return model.getItems().length || model.get( 'integration' ) === 'thrivecart';
			} );

			if ( validRules.length === 0 ) {
				this.$rulesCountMessage.text( TVA.t.noAccessRulesSet );
			} else if ( validRules.length === 1 ) {
				this.$rulesCountMessage.text( TVA.t.oneAccessRuleSet );
			} else {
				this.$rulesCountMessage.text( TVE_Dash.sprintf( TVA.t.accessRulesSet, validRules.length ) );
			}
		},
		/**
		 * Render all the integrations available for TA
		 * @param {Backbone.Collection} integrations
		 */
		renderIntegrations: function ( integrations ) {

			if ( ! integrations ) {
				integrations = this.integrations;
			}

			this.$integrationsWrapper.empty();

			if ( ! ( integrations instanceof Backbone.Collection ) ) {
				return null;
			}

			integrations.each( ( integration ) => {

				const options = {
					model: integration,
					rules: this.model.get( 'rules' )
				};

				const integrationView = ( () => {
					return integration.get( 'slug' ) === 'thrivecart' ?
						new ThriveCartIntegrationView( options ) :
						new IntegrationView( options );
				} )();

				this.$integrationsWrapper.append( integrationView.render().$el );
				this.integrationsViews.push( integrationView );
			} );

			this.renderRulesCount()
		},

		/**
		 * Toggles the private content depending on the private flag
		 *
		 * @param {boolean} isPrivate
		 */
		togglePrivateContent: function ( isPrivate = false ) {

			if ( isPrivate ) {
				//course is private(toggle is on) and integrations have to be rendered
				this.renderIntegrations( this.integrations );
			} else {
				//course is public(toggle is off)
				this.integrationsViews.forEach( ( view, index ) => {
					view.remove();
					view.destroy();
				} );
				this.integrationsViews = [];
			}

			this.$privateContent.hide().filter( `[data-state="${isPrivate ? 1 : 0}"]` ).show();
			this.$restrictionsExclude.toggle( isPrivate );
		},

		/**
		 * Renders the dropdown displayed in the "Restriction label" section
		 */
		renderLabelDropdown() {
			this.labelDropdown.collection.setSelectedId( this.model.get( 'label' ) );

			this.$( '#tva-course-label' ).append( this.labelDropdown.render().$el );
		},
		/**
		 * When a label is changed, set it on the course model and save the course.
		 *
		 * @param {Backbone.Model} selectedModel
		 */
		onLabelChange( selectedModel ) {
			this.model.set( 'label', parseInt( selectedModel.get( 'ID' ) ) );
			if ( this.model.hasChanged( 'label' ) && ! this.model.get( 'is_private' ) ) {
				this.labelDropdown.$el.tvaToggleLoader();
				const courseStructure = this.model.get( 'structure' );
				this.model.save().done( () => {
					this.model.set( 'structure', courseStructure );
					TVE_Dash.success( TVA.t.label_saved );
					this.labelDropdown.$el.tvaToggleLoader();
				} );
			}
		},
		/**
		 * Callback for model change event
		 */
		changeModel: $.noop,
	} );
} )( jQuery );
