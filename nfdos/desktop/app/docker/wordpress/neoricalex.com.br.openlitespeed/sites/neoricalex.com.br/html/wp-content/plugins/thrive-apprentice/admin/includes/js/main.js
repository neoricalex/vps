/**
 * Main Entry Point of JS Logic
 */
( function ( $ ) {

	window.TVA = window.TVA || {};
	TVA.globals = {};
	TVA.Utils = require( './utils' );
	TVA.Utils.LocalStorage = require( './storage' ).instance();

	require( './jquery-plugins' );

	$( function () {

		const coursesCollection = require( './collections/courses' );
		TVA.courses = new coursesCollection( TVA.courses.items, {total: TVA.courses.total} );

		const TopicsCollection = require( './collections/topics' );
		TVA.topics = new TopicsCollection( TVA.topics );

		const LabelsCollection = require( './collections/labels' );
		TVA.labels = new LabelsCollection( TVA.labels );

		//This needs to be localized because when a property is changed, we need to update the UI
		TVA.indexPageModel = new ( require( './models/base-page' ) )( TVA.settings.index_page );

		const router = require( './router' );
		TVA.Router = new router();
		Backbone.history.start( {hashchange: true} );

		if ( ! TVA.settings.wizard.value ) {
			/**
			 * If the wizard is not completed, show the wizard view
			 */
			TVA.Router.navigate( '#wizard', {trigger: true} );
		}

		if ( ! Backbone.history.fragment ) {
			TVA.Router.navigate( '#courses', {trigger: true} );
		}
	} );
} )( jQuery );
