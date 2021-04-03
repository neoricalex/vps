<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-apprentice
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden
}
?>
<?php

$terms       = wp_get_post_terms( $post->ID, TVA_Const::COURSE_TAXONOMY );
$course      = tva_get_course_by_slug( $terms[0]->slug, array( 'published' => true ) );
$topic       = tva_get_topic_by_id( $course->topic );
$settings    = tva_get_settings_manager()->localize_values();
$post_arr    = array_values( wp_list_filter( $course->modules, array( 'ID' => $post->ID ) ) );
$post        = isset( $post_arr[0] ) ? $post_arr[0] : $post;
$allowed     = tva_access_manager()->has_access();
$can_comment = tva_access_manager()->can_comment();

?>

<div class="tva-cm-redesigned-breadcrumbs">
	<?php tva_custom_breadcrumbs(); ?>
</div>
<div class="tva-page-container tva-frontend-template" id="tva-course-module">
	<div class="tva-container">
		<div class="tva-course-head tva-course-head-<?php echo $topic['ID']; ?> tva-course-type-<?php echo $course->course_type_class; ?>">
			<div class="tva-course-icon">
				<?php if ( isset( $topic['icon_type'] ) && ( 'svg_icon' === $topic['icon_type'] ) && isset( $topic['svg_icon'] ) ) : ?>
					<div class="tva-svg-front" id="tva-topic-<?php echo $topic['ID']; ?>">
						<?php echo $topic['svg_icon']; ?>
					</div>
				<?php else : ?>
					<?php $img_url = $topic['icon'] ? $topic['icon'] : TVA_Const::get_default_course_icon_url(); ?>
					<div class="tva-topic-icon" style="background-image:url('<?php echo $img_url; ?>')"></div>
				<?php endif; ?>

				<span class="tva-lesson-name"><?php echo $topic['title']; ?></span>
			</div>
			<div class="tva-uni-course-type">
				<i></i>
				<span><?php echo tva_is_course_guide( $course ) ? __( 'Guide', TVA_Const::T ) : $course->course_type; ?></span>
			</div>
		</div>


		<div class="tva-featured-image-container-single">
			<div class="tva-image-overlay image-<?php echo $topic['ID'] . '-overlay'; ?>"></div>
			<?php if ( ( ! $allowed && $course->cover_image ) || ( ! $post->cover_image && $course->cover_image ) ) : ?>
				<div style="background-image:url('<?php echo $course->cover_image; ?>')" class="tva-image-as-bg tva-post-cover"></div>
			<?php elseif ( $allowed && $post->cover_image ) : ?>
				<div style="background-image:url('<?php echo $post->cover_image; ?>')" class="tva-image-as-bg tva-course-cover"></div>
			<?php else : ?>
				<div class="tva-feaured-image-colored" style="background-color: <?php echo $topic['color']; ?>"></div>
			<?php endif; ?>
		</div>

		<?php if ( have_posts() ) : ?>
			<?php while ( have_posts() ) : ?>
				<?php the_post(); ?>
				<?php $post = isset( $post_arr[0] ) ? $post_arr[0] : $post; ?>

				<section
						class="tva-course-section tva-module-single-page <?php echo ! is_active_sidebar( 'tva-module-sidebar' ) ? 'tva-course-guide-section' : ''; ?>">

					<?php if ( ! $allowed ) : ?>
						<div class="tva-archive-content">
							<p class="tva_course_title">
								<?php echo the_title(); ?>
							</p>

							<div>
								<?php echo $course->message; ?>
							</div>

							<?php include( dirname( __FILE__ ) . '/errors.php' ); ?>

							<?php if ( $settings['loginform'] ) : ?>
								<?php tva_login_form( $course, $post ); ?>
							<?php endif; ?>
						</div>
					<?php else : ?>
						<div class="tva-archive-content">
							<?php show_welcome_msg( $course ); ?>

							<h1 class="tva_course_title">
								<?php echo the_title(); ?>
							</h1>

							<div class="tva_page_headline_wrapper">
								<?php echo $settings['template']['course_module'] . ' ' . ( $post->order + 1 ); ?>
							</div>

							<div class="tva-course-description"><?php echo $post->post_excerpt; ?></div>

							<div class="tva-cm-container">
								<h1><?php echo __( 'Module Structure', 'thrive-apprentice' ); ?></h1>

								<div class="tva-cm-module">
									<?php if ( count( $post->chapters ) > 0 ) : ?>
										<?php foreach ( $post->chapters as $chapter ) : ?>
											<?php echo tva_generate_chapter_html( $chapter, $allowed ); ?>
										<?php endforeach; ?>
									<?php elseif ( count( $post->lessons ) > 0 ) : ?>
										<?php foreach ( $post->lessons as $lesson ) : ?>
											<?php echo tva_generate_lesson_html( $lesson, $post->allowed ); ?>
										<?php endforeach; ?>
									<?php endif; ?>
								</div>
							</div>
							<?php tva_add_tcm_triggers(); ?>
						</div>
					<?php endif; ?>
					<?php if ( true === $can_comment ) : ?>
						<?php comments_template( '', true ); ?>
					<?php endif; ?>
				</section>
			<?php endwhile; ?>
		<?php endif; ?>
		<?php if ( is_active_sidebar( 'tva-module-sidebar' ) ) : ?>
			<aside class="tva-sidebar-container">
				<div class="tva-sidebar-wrapper">
					<?php dynamic_sidebar( 'tva-module-sidebar' ); ?>
				</div>
			</aside>
		<?php endif; ?>
	</div>
</div>

<?php echo tva_add_apprentice_label(); ?>
