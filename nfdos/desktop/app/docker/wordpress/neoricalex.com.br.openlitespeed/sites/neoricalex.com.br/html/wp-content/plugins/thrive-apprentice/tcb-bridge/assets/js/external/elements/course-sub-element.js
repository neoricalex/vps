const Constants = require( '../course/constants' );

module.exports = TVE.renderers.baseModel.extend( {
	render_default: function ( $target ) {
		const courseID = parseInt( $target.closest( Constants.courseIdentifier ).attr( 'data-id' ) ),
			$firstParent = $target.closest( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ),
			contentID = parseInt( $firstParent.attr( 'data-id' ) ),
			firstParentType = TVE._type( $firstParent ),
			shortcodeName = this.key.replace( 'course', firstParentType.replace( '-', '_' ) ),
			course = TVA.courses[ courseID ];
		let shortcodeValue = '';

		if ( courseID === contentID ) { //The content should be from the course
			shortcodeValue = course[ this.key ];

		} else if ( Array.isArray( course.content ) ) {
			const contentItem = course.content.find( item => item.ID === contentID );

			shortcodeValue = contentItem[ this.key ];
		}

		let shortcode;
		_.each( TVE.CONST.inline_shortcodes, ( group, group_name ) => {
			if ( ! shortcode ) {
				shortcode = group.find( item => {
					return ( item.value === this.key );
				} );
			}
		} );

		if ( shortcodeValue === '' ) {
			shortcodeValue = shortcode.option;
		}

		const shortcodeContentHTML = `<span class="thrive-shortcode-content" data-shortcode="${shortcodeName}" data-shortcode-name="${shortcode.option || ''}" contenteditable="false" data-extra_key="">${shortcodeValue}</span>`,
			inlineShortcodeHTML = `<p><span class="thrive-inline-shortcode" contenteditable="false">${shortcodeContentHTML}</span></p>`;

		/* Added tve-inline-post-list-shortcode just to handle the focus after insert */
		return `<div class="thrv_wrapper thrv_text_element tve-inline-post-list-shortcode">${inlineShortcodeHTML}</div>`;
	}
} );
