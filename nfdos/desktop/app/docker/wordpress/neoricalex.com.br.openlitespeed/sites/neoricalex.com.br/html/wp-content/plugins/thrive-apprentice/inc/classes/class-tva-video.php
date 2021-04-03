<?php

/**
 * Class TVA_Video
 * - handles embed code for data provided
 */
class TVA_Video extends TVA_Media {

	/**
	 * Ready made embed code for Custom
	 *
	 * @return string
	 */
	protected function _custom_embed_code() {

		$data = $this->_data;

		/**
		 * If by any change someone puts a wistia url here we try to generate the html based on that url
		 *
		 * @see tva_get_custom_embed_code() wtf is this ?
		 */
		if ( preg_match( '/wistia/', $data['source'] ) && ! preg_match( '/(script)|(iframe)/', $data['source'] ) ) {
			$this->_data['type'] = 'wistia';

			return $this->_wistia_embed_code();
		}

		return html_entity_decode( $data['source'] );
	}

	/**
	 * Ready made embed code for Wistia
	 *
	 * @return string
	 */
	protected function _wistia_embed_code() {

		$url = ! empty( $this->_data['source'] ) ? $this->_data['source'] : '';
		$url = preg_replace( '/\?.*/', '', $url );

		$split = parse_url( $url );
		if ( strpos( $split['host'], 'wistia' ) === false ) {
			return '';
		}

		$exploded = explode( '/', $split['path'] );
		$video_id = end( $exploded );

		$src_url = '//fast.wistia.com/embed/medias/' . $video_id . '.jsonp';

		$embed_code = '<script src="' . $src_url . '" async></script>';
		$embed_code .= '<script src="//fast.wistia.com/assets/external/E-v1.js" async></script>';
		$embed_code .= '<div class="wistia_responsive_padding" style="padding:56.25% 0 0 0;position:relative;">';
		$embed_code .= '<div class="wistia_responsive_wrapper" style="height:100%;left:0;position:absolute;top:0;width:100%;">';
		$embed_code .= '<div class="wistia_embed wistia_async_' . $video_id . ' seo=false videoFoam=true" style="height:100%;width:100%">&nbsp;</div></div></div>';

		return $embed_code;
	}

	/**
	 * Ready made embed code for Vimeo
	 *
	 * @return string
	 */
	protected function _vimeo_embed_code() {

		$width  = '100%';
		$source = ! empty( $this->_data['source'] ) ? $this->_data['source'] : '';

		if ( ! preg_match( '/(https?:\/\/)?(www\.)?(player\.)?vimeo\.com\/([a-z]*\/)*([0-9]{6,11})[?]?.*/', $source, $m ) ) {
			return '';
		}

		$video_id = $m[5];
		$rand_id  = 'player' . rand( 1, 1000 );

		$src_url = '//player.vimeo.com/video/' . $video_id;

		$video_height = '400';

		return "<iframe id='" . $rand_id . "' src='" . $src_url . "' height='" . $video_height . "' width='" . $width . "' frameborder='0' webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>";
	}

	/**
	 * Ready made embed code for YouTube
	 *
	 * @return string
	 */
	protected function _youtube_embed_code() {

		$url_params = array();
		$rand_id    = 'player' . rand( 1, 1000 );
		$video_url  = empty( $this->_data['source'] ) ? '' : $this->_data['source'];
		$options    = empty( $this->_data['options'] ) ? array() : $this->_data['options'];

		parse_str( parse_url( $video_url, PHP_URL_QUERY ), $url_params );

		$video_id = ( isset( $url_params['v'] ) ) ? $url_params['v'] : 0;

		if ( strpos( $video_url, 'youtu.be' ) !== false ) {
			$chunks   = array_filter( explode( '/', $video_url ) );
			$video_id = array_pop( $chunks );
		}

		$src_url = '//www.youtube.com/embed/' . $video_id . '?not_used=1';

		/**
		 * Check if the url is a playlist url
		 */
		$matches = array();

		preg_match( '/^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|list\/|playlist\?list=|playlist\?.+&list=))((\w|-){34})(?:\S+)?$/', $video_url, $matches );

		if ( isset( $matches[1] ) ) {
			$src_url = '//www.youtube.com/embed?listType=playlist&list=' . $matches[1];
		}

		if ( isset( $options['hide-related'] ) ) {
			$src_url .= '&rel=0';
		}
		if ( isset( $options['hide-logo'] ) ) {
			$src_url .= '&modestbranding=1';
		}
		if ( isset( $options['hide-controls'] ) ) {
			$src_url .= '&controls=0';
		}
		if ( isset( $options['hide-title'] ) ) {
			$src_url .= '&showinfo=0';
		}
		$hide_fullscreen = 'allowfullscreen';
		if ( isset( $options['hide-full-screen'] ) ) {
			$src_url .= '&fs=0';
		}
		if ( isset( $options['autoplay'] ) ) {
			$src_url .= '&autoplay=1&mute=1';
		}
		if ( ! isset( $options['video_width'] ) ) {
			$options['video_width']  = '100%';
			$options['video_height'] = 400;
		} else {
			if ( $options['video_width'] > 1080 ) {
				$options['video_width'] = 1080;
			}
			$options['video_height'] = ( $options['video_width'] * 9 ) / 16;
		}

		return '<iframe id="' . $rand_id . '" src="' . $src_url . '" height="' . $options['video_height'] . '" width="' . $options['video_width'] . '" frameborder="0" ' . $hide_fullscreen . ' ></iframe>';
	}
}
