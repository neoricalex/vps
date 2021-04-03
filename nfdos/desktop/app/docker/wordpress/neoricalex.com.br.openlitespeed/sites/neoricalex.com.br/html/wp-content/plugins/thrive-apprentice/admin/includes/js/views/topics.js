( function ( $ ) {
	const BaseView = require( './content-base' );
	const Topic = require( '../models/topic' );
	const TopicView = require( './topics/item' );

	module.exports = BaseView.extend( {
		id: 'tva-topics',

		/**
		 * CSS class name for the mail element of this view
		 */
		className: 'tva-topics',

		/**
		 * Underscore Template
		 *
		 * @type {Function}
		 */
		template: TVE_Dash.tpl( 'topics/dashboard' ),

		/**
		 * Collection of items
		 *
		 * @type {Backbone.Collection}
		 */
		collection: TVA.topics,

		/**
		 * Initialize the collection listeners
		 */
		afterInitialize() {
			this.listenTo( this.collection, 'add', this.render );
			this.listenTo( this.collection, 'remove', this.render );
		},

		/**
		 * Get the container where the items should be rendered
		 *
		 * @return {JQuery}
		 */
		itemsContainer() {
			return this.$( '.tva-topics-list' );
		},

		/**
		 * Renders the template, including the topics list
		 */
		render() {
			BaseView.prototype.render.apply( this, arguments );

			const $list = this.itemsContainer();
			this.collection.each( topic => $list.append( this.newItemView( topic ).render().$el ) );

			return this;
		},

		/**
		 * Instantiate a new Model
		 *
		 * @return {Topic}
		 */
		newModel() {
			return new Topic();
		},

		/**
		 * Instantiate a new item view
		 *
		 * @param {Topic} model
		 *
		 * @return {TopicView}
		 */
		newItemView( model ) {
			return new TopicView( {model, parent: this} );
		},

		/**
		 * Add new topic
		 */
		add() {
			/* 1. instantiate a new model */
			const topic = this.newModel();

			/* 2. save it */
			TVE_Dash.showLoader();
			topic.save().then( () => {
				/* 3. add it to the collection */
				this.collection.add( topic );
				/* 4. enter "edit" state :- show a text input for editing the title */
				topic.set( 'editing', true );
				requestAnimationFrame( () => TVE_Dash.hideLoader() );
			} );
		}
	} );
} )( jQuery );
